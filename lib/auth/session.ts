import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { roleHasPermission, isBackOfficeRole, type Permission } from "@/lib/auth/permissions";

export const PLATFORM_AGENCY_COOKIE = "gonairi-platform-agency";
export const OWNER_AGENCY_COOKIE = "gonairi-owner-agency";

/**
 * Redirects to /login if there is no authenticated agency session. A platform
 * Super Admin may enter the CRM only after choosing a validated agency from
 * the platform area; that agency id then becomes the scope for every CRM query.
 * Without one, they return to the read-only platform-wide overview.
 *
 * `connection()` opts every caller into per-request dynamic rendering. It's here —
 * not sprinkled as `export const dynamic = "force-dynamic"` on individual page/layout
 * files — because every protected page and Server Action already calls this function
 * as its first line, so this is the one place that guarantees no session-derived
 * render is ever eligible for Next's Full Route Cache, without relying on every
 * future page remembering a separate route-segment-config export.
 */
export async function requireSession() {
  await connection();
  const session = await auth();
  if (session?.platformAdmin) {
    const organizationId = (await cookies()).get(PLATFORM_AGENCY_COOKIE)?.value;
    if (!organizationId) {
      redirect("/admin/overview");
    }
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!organization) {
      redirect("/admin/overview");
    }
    return {
      ...session,
      user: {
        id: session.platformAdmin.id,
        email: session.platformAdmin.email,
        name: session.platformAdmin.name,
        organizationId: organization.id,
        role: "OWNER" as const,
        availableRoles: ["OWNER" as const],
      },
    };
  }
  if (!session?.user) {
    redirect("/login");
  }
  const account = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      status: "ACTIVE",
    },
    select: {
      organizationId: true,
      roles: true,
      ownedOrganizations: {
        orderBy: { createdAt: "asc" },
        select: { id: true },
      },
    },
  });
  if (!account) {
    redirect("/login");
  }
  if (!session.user.role || !account.roles.includes(session.user.role)) {
    redirect("/select-role");
  }

  let organizationId = account.organizationId;
  if (session.user.role === "OWNER") {
    const ownedOrganizationIds = new Set(
      account.ownedOrganizations.map((organization) => organization.id),
    );
    const requestedOrganizationId = (await cookies()).get(OWNER_AGENCY_COOKIE)?.value;
    organizationId =
      requestedOrganizationId && ownedOrganizationIds.has(requestedOrganizationId)
        ? requestedOrganizationId
        : account.organizationId && ownedOrganizationIds.has(account.organizationId)
          ? account.organizationId
          : account.ownedOrganizations[0]?.id;
  }
  if (!organizationId) {
    redirect("/login");
  }

  return {
    ...session,
    user: {
      ...session.user,
      organizationId,
      availableRoles: account.roles,
    },
  };
}

/**
 * The preferred gate for back-office actions and pages — checks a specific
 * Permission (see lib/auth/permissions.ts) instead of a hardcoded role list.
 * Sends a rejected user somewhere they can actually land: drivers/guides go
 * to their own schedule, everyone else goes to the dashboard overview.
 */
export async function requirePermission(permission: Permission) {
  const session = await requireSession();
  if (session.platformAdmin) {
    return session;
  }
  if (!(await roleHasPermission(session.user.role, permission))) {
    redirect(isBackOfficeRole(session.user.role) ? "/dashboard" : "/dashboard/schedule");
  }
  return session;
}

/** Staff accounts are security-sensitive and can only be managed by the
 * agency Owner. A platform Super Admin operating inside an agency is also
 * allowed. This deliberately cannot be delegated through the role matrix. */
export async function requireOwner() {
  const session = await requireSession();
  if (!session.platformAdmin && session.user.role !== "OWNER") {
    redirect(isBackOfficeRole(session.user.role) ? "/dashboard" : "/dashboard/schedule");
  }
  return session;
}
