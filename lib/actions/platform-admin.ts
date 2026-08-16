"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import * as z from "zod";
import { signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin-session";
import { PLATFORM_AGENCY_COOKIE } from "@/lib/auth/session";
import { ALL_PERMISSIONS, OWNER_ONLY_PERMISSIONS, OWNER_PERMISSION_FLOOR, ROLES, type Permission } from "@/lib/auth/permissions";
import type { UserRole } from "@/generated/prisma/enums";
import type { FormState } from "@/lib/form-state";
import { formStateFromZodError } from "@/lib/form-state";
import { slugify, uniqueSlug } from "@/lib/slug";

export async function logoutPlatformAdmin() {
  (await cookies()).delete(PLATFORM_AGENCY_COOKIE);
  await signOut({ redirectTo: "/login" });
}

const CreateOrganizationSchema = z.object({
  organizationName: z.string().trim().min(2, "Agency name must be at least 2 characters."),
  ownerId: z.string().min(1, "Select an existing Owner user."),
});

export async function createOrganization(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePlatformAdmin();
  const parsed = CreateOrganizationSchema.safeParse({
    organizationName: formData.get("organizationName"),
    ownerId: formData.get("ownerId"),
  });
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  const owner = await prisma.user.findFirst({
    where: {
      id: parsed.data.ownerId,
      status: "ACTIVE",
      roles: { has: "OWNER" },
    },
    select: { id: true, organizationId: true },
  });
  if (!owner) {
    return { error: "Select an active user who has the Owner role." };
  }

  const base = slugify(parsed.data.organizationName) || "agency";
  const slug = await uniqueSlug(base, async (candidate) =>
    Boolean(await prisma.organization.findUnique({ where: { slug: candidate }, select: { id: true } })),
  );
  await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: parsed.data.organizationName,
        slug,
        ownerId: owner.id,
      },
      select: { id: true },
    });

    // An Owner candidate can be created before the platform's first agency.
    // Once their first agency exists, make it their primary staff organization;
    // later agencies are linked through Organization.ownerId without moving them.
    if (!owner.organizationId) {
      await tx.user.update({
        where: { id: owner.id },
        data: { organizationId: organization.id },
      });
    }
  });

  revalidatePath("/admin/agencies");
  redirect("/admin/agencies");
}

export async function openOrganizationCrm(
  organizationId: string,
  destination: "dashboard" | "staff",
): Promise<void> {
  await requirePlatformAdmin();
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });
  if (!organization) {
    return;
  }

  (await cookies()).set(PLATFORM_AGENCY_COOKIE, organization.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  redirect(destination === "staff" ? "/dashboard/staff" : "/dashboard");
}

export async function switchOrganizationCrm(formData: FormData): Promise<void> {
  await requirePlatformAdmin();
  const organizationId = formData.get("organizationId")?.toString();
  if (!organizationId) {
    redirect("/admin/agencies");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });
  if (!organization) {
    redirect("/admin/agencies");
  }

  (await cookies()).set(PLATFORM_AGENCY_COOKIE, organization.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  // Always return to the overview: the previous URL may contain a tour,
  // booking, or customer id belonging to the agency we just switched away from.
  redirect("/dashboard");
}

const VALID_ROLES = new Set<string>(ROLES);
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

  const permissions = new Set(
    role === "OWNER"
      ? submitted
      : submitted.filter((permission) => !OWNER_ONLY_PERMISSIONS.has(permission)),
  );
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
