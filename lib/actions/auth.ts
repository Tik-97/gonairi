"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth, signIn, signOut, unstable_update } from "@/auth";
import { prisma } from "@/lib/db";
import { OWNER_AGENCY_COOKIE } from "@/lib/auth/session";
import { isBackOfficeRole } from "@/lib/auth/permissions";
import type { FormState } from "@/lib/form-state";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import type { UserRole } from "@/generated/prisma/enums";

export async function login(_prevState: FormState, formData: FormData): Promise<FormState> {
  if (isRateLimited(`login:${await clientIp()}`, { limit: 10, windowMs: 60_000 })) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/select-role",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function selectActiveRole(role: UserRole): Promise<void> {
  const session = await auth();
  if (!session?.user || session.platformAdmin) {
    redirect("/login");
  }

  const account = await prisma.user.findFirst({
    where: { id: session.user.id, status: "ACTIVE", roles: { has: role } },
    select: { id: true },
  });
  if (!account) {
    redirect("/select-role");
  }

  await unstable_update({ user: { role } });
  redirect(isBackOfficeRole(role) ? "/dashboard" : "/dashboard/schedule");
}

export async function switchOwnedOrganization(formData: FormData): Promise<void> {
  const session = await auth();
  const organizationId = formData.get("organizationId")?.toString();
  if (
    !session?.user ||
    session.platformAdmin ||
    session.user.role !== "OWNER" ||
    !organizationId
  ) {
    redirect("/login");
  }

  const owner = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      status: "ACTIVE",
      roles: { has: "OWNER" },
      ownedOrganizations: { some: { id: organizationId } },
    },
    select: { id: true },
  });
  if (!owner) {
    redirect("/dashboard");
  }

  (await cookies()).set(OWNER_AGENCY_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  redirect("/dashboard");
}

export async function logout() {
  (await cookies()).delete(OWNER_AGENCY_COOKIE);
  await signOut({ redirectTo: "/" });
}
