import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { roleHasPermission, isBackOfficeRole, type Permission } from "@/lib/auth/permissions";

/** Redirects to /login if there is no authenticated staff (tenant) session.
 *  Also rejects a platform-admin session — that principal has no organizationId/role
 *  and must never fall through to tenant-scoped code. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user || !session.user.organizationId) {
    redirect("/login");
  }
  return session;
}

/**
 * The preferred gate for back-office actions and pages — checks a specific
 * Permission (see lib/auth/permissions.ts) instead of a hardcoded role list.
 * Sends a rejected user somewhere they can actually land: drivers/guides go
 * to their own schedule, everyone else goes to the dashboard overview.
 */
export async function requirePermission(permission: Permission) {
  const session = await requireSession();
  if (!(await roleHasPermission(session.user.role, permission))) {
    redirect(isBackOfficeRole(session.user.role) ? "/dashboard" : "/dashboard/schedule");
  }
  return session;
}
