import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";

/**
 * Redirects to the shared /login page if there is no authenticated platform-admin session.
 * Deliberately separate from requireSession() — a tenant staff session must never
 * satisfy this, and vice versa.
 *
 * `connection()` — see the matching comment in lib/auth/session.ts — centralizes
 * the per-request dynamic-rendering opt-in here instead of a route-segment-config
 * export per file.
 */
export async function requirePlatformAdmin() {
  await connection();
  const session = await auth();
  if (!session?.platformAdmin) {
    redirect("/login");
  }
  return session;
}
