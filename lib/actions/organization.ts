"use server";

import * as z from "zod";
import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { optionalPhoneField } from "@/lib/phone";
import { formStateFromZodError } from "@/lib/form-state";

const OrganizationSchema = z.object({
  name: z.string().trim().min(2, "Agency name must be at least 2 characters."),
  description: z.string().trim().optional(),
  contactEmail: z.string().trim().optional(),
  contactPhone: optionalPhoneField,
  isPublished: z.coerce.boolean().optional(),
});

// Genuinely different from the shared FormState (adds `success`), so this one
// isn't consolidated — see lib/form-state.ts's doc comment.
export type FormState = { error?: string; success?: boolean } | undefined;

// Organization is the tenant itself (not a tenant-scoped model), so this uses the
// raw client directly, filtered explicitly to the caller's own organization id.
export async function updateOrganization(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await requireOwner();
  const parsed = OrganizationSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    isPublished: formData.get("isPublished"),
  });
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
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
