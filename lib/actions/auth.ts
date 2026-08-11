"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { slugify, uniqueSlug } from "@/lib/slug";
import { formStateFromZodError, type FormState } from "@/lib/form-state";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

const RegisterSchema = z.object({
  organizationName: z.string().trim().min(2, "Agency name must be at least 2 characters."),
  ownerName: z.string().trim().min(2, "Your name must be at least 2 characters."),
  email: z.email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

async function uniqueOrganizationSlug(name: string): Promise<string> {
  const base = slugify(name) || "agency";
  return uniqueSlug(base, async (candidate) => Boolean(await prisma.organization.findUnique({ where: { slug: candidate } })));
}

export async function registerOrganization(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = RegisterSchema.safeParse({
    organizationName: formData.get("organizationName"),
    ownerName: formData.get("ownerName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  if (isRateLimited(`register:${await clientIp()}`, { limit: 5, windowMs: 60_000 })) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const { organizationName, ownerName, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "This email is already registered." };
  }

  const slug = await uniqueOrganizationSlug(organizationName);
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.organization.create({
    data: {
      name: organizationName,
      slug,
      users: {
        create: {
          name: ownerName,
          email,
          passwordHash,
          role: "OWNER",
        },
      },
    },
  });

  return login(undefined, formData);
}

export async function login(_prevState: FormState, formData: FormData): Promise<FormState> {
  if (isRateLimited(`login:${await clientIp()}`, { limit: 10, windowMs: 60_000 })) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
