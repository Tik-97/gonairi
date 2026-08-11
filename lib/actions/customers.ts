"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { optionalPhoneField } from "@/lib/phone";
import { formStateFromZodError, type FormState } from "@/lib/form-state";

export type CustomerSearchResult = { id: string; fullName: string; email: string | null; phone: string | null };

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
});

function parseCustomerForm(formData: FormData) {
  return CustomerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    nationality: formData.get("nationality"),
    notes: formData.get("notes"),
  });
}

export async function createCustomer(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await requirePermission(PERMISSIONS.customersManage);
  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  const db = scopedPrisma(session.user.organizationId);

  if (parsed.data.email) {
    const existing = await db.customer.findFirst({ where: { email: parsed.data.email } });
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
      source: "MANUAL",
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
  const existing = await db.customer.findFirst({ where: { id: customerId } });
  if (!existing) {
    return { error: "Customer not found." };
  }

  if (parsed.data.email) {
    const emailOwner = await db.customer.findFirst({ where: { email: parsed.data.email } });
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
    },
  });

  redirect(`/dashboard/customers/${customerId}`);
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const session = await requirePermission(PERMISSIONS.customersDelete);
  const db = scopedPrisma(session.user.organizationId);

  const existing = await db.customer.findFirst({ where: { id: customerId } });
  if (!existing) {
    return;
  }

  // The delete button is only shown when there are zero bookings; this is a
  // defense-in-depth check in case one slipped in between page load and click.
  const bookingCount = await db.booking.count({ where: { customerId } });
  if (bookingCount > 0) {
    return;
  }

  await db.customer.delete({ where: { id: customerId } });
  redirect("/dashboard/customers");
}
