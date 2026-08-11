"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { slugify } from "@/lib/slug";

const RegisterSchema = z.object({
  organizationName: z.string().trim().min(2, "Agency name must be at least 2 characters."),
  ownerName: z.string().trim().min(2, "Your name must be at least 2 characters."),
  email: z.email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type FormState = { error?: string } | undefined;

async function uniqueOrganizationSlug(name: string): Promise<string> {
  const base = slugify(name) || "agency";
  let candidate = base;
  let attempt = 1;
  while (await prisma.organization.findUnique({ where: { slug: candidate } })) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
  return candidate;
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
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
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
