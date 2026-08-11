import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { roleHasPermission, isBackOfficeRole, type Permission } from "@/lib/auth/permissions";

/**
 * Redirects to /login if there is no authenticated staff (tenant) session.
 * Also rejects a platform-admin session — that principal has no organizationId/role
 * and must never fall through to tenant-scoped code.
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
