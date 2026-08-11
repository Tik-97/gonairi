"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin-session";
import { ALL_PERMISSIONS, OWNER_PERMISSION_FLOOR, type Permission } from "@/lib/auth/permissions";
import type { UserRole } from "@/generated/prisma/enums";

export type FormState = { error?: string } | undefined;

export async function loginPlatformAdmin(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await signIn("platform-admin", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin/roles",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function logoutPlatformAdmin() {
  await signOut({ redirectTo: "/admin/login" });
}

const VALID_ROLES = new Set<string>(["OWNER", "ADMIN", "OPERATOR", "DRIVER", "GUIDE"]);
const VALID_PERMISSIONS = new Set<string>(ALL_PERMISSIONS);

/** Replaces a role's entire permission set with the checked boxes from the form.
 *  OWNER always keeps OWNER_PERMISSION_FLOOR even if unchecked, so an SA mistake
 *  here can never lock every account in an agency out of its own settings/staff. */
export async function updateRolePermissions(role: string, formData: FormData): Promise<void> {
  await requirePlatformAdmin();

  if (!VALID_ROLES.has(role)) {
    return;
  }

  const submitted = formData
    .getAll("permission")
    .map((v) => v.toString())
    .filter((p) => VALID_PERMISSIONS.has(p)) as Permission[];

  const permissions = new Set(submitted);
  if (role === "OWNER") {
    for (const floor of OWNER_PERMISSION_FLOOR) {
      permissions.add(floor);
    }
  }

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { role: role as UserRole } }),
    prisma.rolePermission.createMany({
      data: Array.from(permissions).map((permission) => ({ role: role as UserRole, permission })),
    }),
  ]);

  // Every tenant's back office reads this role's permissions — a stale cached
  // render anywhere under /dashboard would show/allow actions this role can no
  // longer perform, so invalidate that whole tree, not just this admin page.
  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin/roles");

  redirect("/admin/roles");
}
