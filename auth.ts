import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/enums";

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const admin = await prisma.platformAdmin.findUnique({ where: { email } });
        if (admin && await bcrypt.compare(password, admin.passwordHash)) {
          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            isPlatformAdmin: true,
          };
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.status !== "ACTIVE" || user.roles.length === 0) {
          return null;
        }
        if (!(await bcrypt.compare(password, user.passwordHash))) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizationId ?? undefined,
          availableRoles: user.roles,
          role: user.roles.length === 1 ? user.roles[0] : undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        if (user.isPlatformAdmin) {
          token.isPlatformAdmin = true;
          token.organizationId = undefined;
          token.role = undefined;
          token.availableRoles = undefined;
        } else {
          token.isPlatformAdmin = undefined;
          token.organizationId = user.organizationId;
          token.role = user.role;
          token.availableRoles = user.availableRoles;
        }
      } else if (trigger === "update" && !token.isPlatformAdmin && token.sub) {
        // Session-update payloads are client-controlled. Re-read the account and
        // accept an active role only when it is still assigned in the database.
        const account = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { organizationId: true, roles: true, status: true },
        });
        const requestedRole = session?.user?.role as UserRole | undefined;
        if (!account || account.status !== "ACTIVE") {
          return null;
        }
        token.organizationId = account.organizationId ?? undefined;
        token.availableRoles = account.roles;
        token.role = requestedRole && account.roles.includes(requestedRole)
          ? requestedRole
          : undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.isPlatformAdmin) {
        session.platformAdmin = {
          id: token.sub as string,
          email: session.user?.email ?? "",
          name: session.user?.name ?? "",
        };
      } else if (session.user) {
        session.user.id = token.sub as string;
        session.user.organizationId = token.organizationId as string;
        session.user.role = token.role as UserRole;
        session.user.availableRoles = (token.availableRoles as UserRole[] | undefined) ?? [];
      }
      return session;
    },
  },
});
