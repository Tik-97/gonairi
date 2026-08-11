import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminRootPage() {
  const session = await auth();
  redirect(session?.platformAdmin ? "/admin/roles" : "/admin/login");
}
