"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin-session";
import { ROLES } from "@/lib/auth/permissions";
import { formStateFromZodError, type FormState } from "@/lib/form-state";
import type { UserRole } from "@/generated/prisma/enums";

const ROLE_VALUES = ROLES as [UserRole, ...UserRole[]];

const CreatePlatformUserSchema = z
  .object({
    organizationId: z.string().optional(),
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    email: z.email("Enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    roles: z.array(z.enum(ROLE_VALUES)).min(1, "Select at least one role."),
  })
  .superRefine((data, ctx) => {
    if (!data.organizationId && !data.roles.includes("OWNER")) {
      ctx.addIssue({
        code: "custom",
        path: ["organizationId"],
        message: "Only an Owner user can be created without an agency.",
      });
    }
  });

const UpdatePlatformUserRolesSchema = z.object({
  roles: z.array(z.enum(ROLE_VALUES)).min(1, "Every user must have at least one role."),
});

export async function createPlatformUser(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePlatformAdmin();
  const parsed = CreatePlatformUserSchema.safeParse({
    organizationId: formData.get("organizationId")?.toString() || undefined,
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    roles: formData.getAll("roles"),
  });
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  const [organization, existingUser, existingAdmin] = await Promise.all([
    parsed.data.organizationId
      ? prisma.organization.findUnique({
          where: { id: parsed.data.organizationId },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    }),
    prisma.platformAdmin.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    }),
  ]);
  if (parsed.data.organizationId && !organization) {
    return { error: "Agency not found." };
  }
  if (existingUser || existingAdmin) {
    return { error: "This email is already registered." };
  }

  await prisma.user.create({
    data: {
      organizationId: organization?.id ?? null,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      roles: parsed.data.roles,
    },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updatePlatformUserRoles(
  userId: string,
  formData: FormData,
): Promise<void> {
  await requirePlatformAdmin();
  const parsed = UpdatePlatformUserRolesSchema.safeParse({
    roles: formData.getAll("roles"),
  });
  if (!parsed.success) {
    redirect("/admin/users?error=roles");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      roles: true,
      _count: { select: { ownedOrganizations: true } },
    },
  });
  if (!user) {
    redirect("/admin/users");
  }

  if (user.roles.includes("OWNER") && !parsed.data.roles.includes("OWNER")) {
    if (user._count.ownedOrganizations > 0) {
      redirect("/admin/users?error=assigned-owner");
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { roles: parsed.data.roles },
  });
  revalidatePath("/admin/users");
  revalidatePath("/dashboard", "layout");
  redirect("/admin/users");
}
