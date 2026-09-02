"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { optionalPhoneField } from "@/lib/phone";
import { formStateFromZodError, type FormState } from "@/lib/form-state";
import { deleteCustomerDocumentFile } from "@/lib/actions/upload";

export type CustomerSearchResult = { id: string; fullName: string; email: string | null; phone: string | null };

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const optionalDateField = z.string().trim().refine((value) => !value || datePattern.test(value), "Enter a valid date.");
const requiredDateField = z.string().trim().regex(datePattern, "Enter a valid date.");

/** Typeahead search — never loads the full customer list into the page. */
export async function searchCustomers(query: string): Promise<CustomerSearchResult[]> {
  const session = await requirePermission(PERMISSIONS.customersView);
  const db = scopedPrisma(session.user.organizationId);
  const trimmed = query.trim();

  if (!trimmed) {
    return db.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, fullName: true, email: true, phone: true },
    });
  }

  return db.customer.findMany({
    where: {
      OR: [
        { fullName: { contains: trimmed, mode: "insensitive" } },
        { email: { contains: trimmed, mode: "insensitive" } },
        { phone: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    orderBy: { fullName: "asc" },
    take: 8,
    select: { id: true, fullName: true, email: true, phone: true },
  });
}

const CustomerSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().optional(),
  phone: optionalPhoneField,
  nationality: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  birthDate: optionalDateField,
  passportNumber: z.string().trim().min(3, "Passport number is required."),
  passportIssuedBy: z.string().trim().min(2, "Passport issuing authority is required."),
  passportIssueDate: optionalDateField,
  passportExpiryDate: requiredDateField,
  whatsapp: optionalPhoneField,
  telegram: z.string().trim().max(100).optional(),
  visaStatus: z.enum(["NOT_REQUIRED", "NOT_STARTED", "IN_PROGRESS", "APPROVED", "REJECTED", "EXPIRED"]),
  visaCountry: z.string().trim().optional(),
  visaType: z.string().trim().optional(),
  visaApplicationDate: optionalDateField,
  visaDecisionDate: optionalDateField,
  visaExpiryDate: optionalDateField,
  status: z.enum([
    "REGISTERED", "DOCUMENTS_PENDING", "VISA_PENDING", "VISA_CONFIRMED", "VISA_REJECTED",
    "WAITING_TRAVEL", "TRAVELLING", "TRAVEL_COMPLETED", "CANCELLED",
  ]),
  statusNote: z.string().trim().max(500).optional(),
  documents: z.array(z.object({
    url: z.string().trim().min(1),
    name: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().max(100).optional(),
    size: z.number().int().min(0).max(10 * 1024 * 1024).optional(),
  })).max(20),
});

function optionalDate(value: string): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function documentsBelongToOrganization(documents: { url: string }[], organizationId: string): boolean {
  return documents.every(({ url }) => {
    if (url.startsWith("local:customers/")) {
      return url.startsWith(`local:customers/${organizationId}/`);
    }
    try {
      const parsed = new URL(url);
      return parsed.hostname.endsWith(".blob.vercel-storage.com")
        && parsed.pathname.startsWith(`/customers/${organizationId}/`);
    } catch {
      return false;
    }
  });
}

function parseCustomerForm(formData: FormData) {
  return CustomerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    nationality: formData.get("nationality"),
    notes: formData.get("notes"),
    birthDate: formData.get("birthDate"),
    passportNumber: formData.get("passportNumber"),
    passportIssuedBy: formData.get("passportIssuedBy"),
    passportIssueDate: formData.get("passportIssueDate"),
    passportExpiryDate: formData.get("passportExpiryDate"),
    whatsapp: formData.get("whatsappSameAsPhone") ? formData.get("phone") : formData.get("whatsapp"),
    telegram: formData.get("telegram"),
    visaStatus: formData.get("visaStatus") ?? "NOT_STARTED",
    visaCountry: formData.get("visaCountry"),
    visaType: formData.get("visaType"),
    visaApplicationDate: formData.get("visaApplicationDate"),
    visaDecisionDate: formData.get("visaDecisionDate"),
    visaExpiryDate: formData.get("visaExpiryDate"),
    status: formData.get("status") ?? "REGISTERED",
    statusNote: formData.get("statusNote"),
    documents: (() => {
      try { return JSON.parse(formData.get("documents")?.toString() ?? "[]"); }
      catch { return null; }
    })(),
  });
}

export async function createCustomer(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await requirePermission(PERMISSIONS.customersManage);
  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  const db = scopedPrisma(session.user.organizationId);

  if (!documentsBelongToOrganization(parsed.data.documents, session.user.organizationId)) {
    return { error: "One or more uploaded documents are invalid. Please upload them again." };
  }

  if (parsed.data.email) {
    const existing = await db.customer.findFirst({ where: { email: { equals: parsed.data.email, mode: "insensitive" } } });
    if (existing) {
      return { error: `A customer with this email already exists: ${existing.fullName}.` };
    }
  }

  const customer = await db.customer.create({
    data: {
      organizationId: session.user.organizationId,
      fullName: parsed.data.fullName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      nationality: parsed.data.nationality || null,
      notes: parsed.data.notes || null,
      birthDate: optionalDate(parsed.data.birthDate ?? ""),
      passportNumber: parsed.data.passportNumber,
      passportIssuedBy: parsed.data.passportIssuedBy,
      passportIssueDate: optionalDate(parsed.data.passportIssueDate ?? ""),
      passportExpiryDate: optionalDate(parsed.data.passportExpiryDate),
      whatsapp: parsed.data.whatsapp || null,
      telegram: parsed.data.telegram || null,
      visaStatus: parsed.data.visaStatus,
      visaCountry: parsed.data.visaCountry || null,
      visaType: parsed.data.visaType || null,
      visaApplicationDate: optionalDate(parsed.data.visaApplicationDate ?? ""),
      visaDecisionDate: optionalDate(parsed.data.visaDecisionDate ?? ""),
      visaExpiryDate: optionalDate(parsed.data.visaExpiryDate ?? ""),
      status: parsed.data.status,
      source: "MANUAL",
      documents: {
        create: parsed.data.documents.map((document) => ({
          organizationId: session.user.organizationId,
          ...document,
        })),
      },
      statusHistory: {
        create: {
          organizationId: session.user.organizationId,
          changedByUserId: session.platformAdmin ? null : session.user.id,
          toStatus: parsed.data.status,
          note: parsed.data.statusNote || "Customer registered",
        },
      },
    },
  });

  redirect(`/dashboard/customers/${customer.id}`);
}

export async function updateCustomer(
  customerId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requirePermission(PERMISSIONS.customersManage);
  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  const db = scopedPrisma(session.user.organizationId);
  if (!documentsBelongToOrganization(parsed.data.documents, session.user.organizationId)) {
    return { error: "One or more uploaded documents are invalid. Please upload them again." };
  }
  const existing = await db.customer.findFirst({ where: { id: customerId }, include: { documents: true } });
  if (!existing) {
    return { error: "Customer not found." };
  }

  if (parsed.data.email) {
    const emailOwner = await db.customer.findFirst({ where: { email: { equals: parsed.data.email, mode: "insensitive" } } });
    if (emailOwner && emailOwner.id !== customerId) {
      return { error: `Another customer already uses this email: ${emailOwner.fullName}.` };
    }
  }

  await db.customer.update({
    where: { id: customerId },
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      nationality: parsed.data.nationality || null,
      notes: parsed.data.notes || null,
      birthDate: optionalDate(parsed.data.birthDate ?? ""),
      passportNumber: parsed.data.passportNumber,
      passportIssuedBy: parsed.data.passportIssuedBy,
      passportIssueDate: optionalDate(parsed.data.passportIssueDate ?? ""),
      passportExpiryDate: optionalDate(parsed.data.passportExpiryDate),
      whatsapp: parsed.data.whatsapp || null,
      telegram: parsed.data.telegram || null,
      visaStatus: parsed.data.visaStatus,
      visaCountry: parsed.data.visaCountry || null,
      visaType: parsed.data.visaType || null,
      visaApplicationDate: optionalDate(parsed.data.visaApplicationDate ?? ""),
      visaDecisionDate: optionalDate(parsed.data.visaDecisionDate ?? ""),
      visaExpiryDate: optionalDate(parsed.data.visaExpiryDate ?? ""),
      status: parsed.data.status,
      documents: {
        deleteMany: { url: { notIn: parsed.data.documents.map((document) => document.url) } },
        create: parsed.data.documents
          .filter((document) => !existing.documents.some((current) => current.url === document.url))
          .map((document) => ({
          organizationId: session.user.organizationId,
          ...document,
          })),
      },
      ...(existing.status !== parsed.data.status ? {
        statusHistory: {
          create: {
            organizationId: session.user.organizationId,
            changedByUserId: session.platformAdmin ? null : session.user.id,
            fromStatus: existing.status,
            toStatus: parsed.data.status,
            note: parsed.data.statusNote || null,
          },
        },
      } : {}),
    },
  });

  const retainedUrls = new Set(parsed.data.documents.map((document) => document.url));
  await Promise.all(
    existing.documents
      .filter((document) => !retainedUrls.has(document.url))
      .map((document) => deleteCustomerDocumentFile(document.url)),
  );

  redirect(`/dashboard/customers/${customerId}`);
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const session = await requirePermission(PERMISSIONS.customersDelete);
  const db = scopedPrisma(session.user.organizationId);

  const existing = await db.customer.findFirst({ where: { id: customerId }, include: { documents: true } });
  if (!existing) {
    return;
  }

  // The delete button is only shown when there are zero bookings; this is a
  // defense-in-depth check in case one slipped in between page load and click.
  const [bookingCount, individualTourCount] = await Promise.all([
    db.booking.count({ where: { customerId } }),
    db.tourCustomer.count({ where: { customerId } }),
  ]);
  if (bookingCount > 0 || individualTourCount > 0) {
    return;
  }

  await db.customer.delete({ where: { id: customerId } });
  await Promise.all(existing.documents.map((document) => deleteCustomerDocumentFile(document.url)));
  redirect("/dashboard/customers");
}
