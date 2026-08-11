import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/enums";

export const { handlers, signIn, signOut, auth } = NextAuth({
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

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.status !== "ACTIVE") {
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizationId,
          role: user.role,
        };
      },
    }),
    // Separate provider for the platform-level Super Admin dashboard (/admin) —
    // PlatformAdmin accounts are not tenant Users and carry no organizationId/role.
    Credentials({
      id: "platform-admin",
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
        if (!admin) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          isPlatformAdmin: true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (user.isPlatformAdmin) {
          token.isPlatformAdmin = true;
          token.organizationId = undefined;
          token.role = undefined;
        } else {
          token.organizationId = user.organizationId;
          token.role = user.role;
        }
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
      }
      return session;
    },
  },
});
