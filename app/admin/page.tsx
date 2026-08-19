import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";

export default async function AdminRootPage() {
  // Doesn't go through requirePlatformAdmin()/requireSession() (it needs to redirect
  // to either destination, not just reject one) — see lib/auth/session.ts for why
  // this call is needed directly here instead.
  await connection();
  const session = await auth();
  redirect(session?.platformAdmin ? "/admin/overview" : "/login");
}
