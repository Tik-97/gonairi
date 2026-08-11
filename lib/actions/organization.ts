"use server";

import * as z from "zod";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { isValidOptionalPhone } from "@/lib/phone";

const OrganizationSchema = z.object({
  name: z.string().trim().min(2, "Agency name must be at least 2 characters."),
  description: z.string().trim().optional(),
  contactEmail: z.string().trim().optional(),
  contactPhone: z.string().trim().optional().refine(isValidOptionalPhone, "Enter a valid phone number."),
  isPublished: z.coerce.boolean().optional(),
});

export type FormState = { error?: string; success?: boolean } | undefined;

// Organization is the tenant itself (not a tenant-scoped model), so this uses the
// raw client directly, filtered explicitly to the caller's own organization id.
export async function updateOrganization(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await requirePermission(PERMISSIONS.orgSettingsManage);
  const parsed = OrganizationSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    isPublished: formData.get("isPublished"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
      isPublished: Boolean(parsed.data.isPublished),
    },
  });

  return { success: true };
}
