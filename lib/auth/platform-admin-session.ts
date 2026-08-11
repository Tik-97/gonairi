import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Redirects to /admin/login if there is no authenticated platform-admin session.
 *  Deliberately separate from requireSession() — a tenant staff session must never
 *  satisfy this, and vice versa. */
export async function requirePlatformAdmin() {
  const session = await auth();
  if (!session?.platformAdmin) {
    redirect("/admin/login");
  }
  return session;
}
