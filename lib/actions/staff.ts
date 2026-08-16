"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth/session";
import { scopedPrisma } from "@/lib/db/scoped";
import { prisma } from "@/lib/db";
import { optionalPhoneField } from "@/lib/phone";
import { formStateFromZodError, type FormState } from "@/lib/form-state";
import type { UserRole } from "@/generated/prisma/enums";

const ASSIGNABLE_ROLES = ["OPERATOR", "DRIVER", "GUIDE", "DRIVER_GUIDE"] as const;

const CreateStaffSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phone: optionalPhoneField,
  roles: z.array(z.enum(ASSIGNABLE_ROLES)).min(1, "Select at least one role."),
});

const UpdateStaffSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  phone: optionalPhoneField,
  roles: z.array(z.enum(ASSIGNABLE_ROLES)).min(1, "Select at least one role."),
});

export async function createStaffMember(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await requireOwner();
  const parsed = CreateStaffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
    roles: formData.getAll("roles"),
  });
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  // Email is globally unique across the whole platform, not just this org.
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "This email is already registered." };
  }

  const db = scopedPrisma(session.user.organizationId);
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await db.user.create({
    data: {
      organizationId: session.user.organizationId,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      phone: parsed.data.phone || null,
      roles: parsed.data.roles as UserRole[],
    },
  });

  redirect("/dashboard/staff");
}

export async function updateStaffMember(
  userId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireOwner();
  const parsed = UpdateStaffSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    roles: formData.getAll("roles"),
  });
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  const db = scopedPrisma(session.user.organizationId);
  const existing = await db.user.findFirst({ where: { id: userId } });
  if (!existing) {
    return { error: "Staff member not found." };
  }
  if (existing.roles.includes("OWNER")) {
    return { error: "The agency owner's roles can't be changed here." };
  }

  await db.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      roles: parsed.data.roles as UserRole[],
    },
  });

  redirect("/dashboard/staff");
}

export async function toggleStaffStatus(userId: string): Promise<void> {
  const session = await requireOwner();
  const db = scopedPrisma(session.user.organizationId);
  const user = await db.user.findFirst({ where: { id: userId } });
  if (!user) {
    return;
  }
  if (user.roles.includes("OWNER")) {
    return;
  }
  if (user.id === session.user.id) {
    return;
  }

  await db.user.update({
    where: { id: userId },
    data: { status: user.status === "DISABLED" ? "ACTIVE" : "DISABLED" },
  });

  redirect("/dashboard/staff");
}
