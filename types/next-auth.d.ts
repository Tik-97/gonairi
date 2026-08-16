import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    organizationId?: string;
    role?: UserRole;
    availableRoles?: UserRole[];
    isPlatformAdmin?: boolean;
  }

  interface Session {
    user: {
      id: string;
      organizationId: string;
      role: UserRole;
      availableRoles: UserRole[];
    } & DefaultSession["user"];
    /** Set only when the shared credentials provider authenticates a PlatformAdmin —
     *  never populated alongside a tenant session, and vice versa. */
    platformAdmin?: {
      id: string;
      email: string;
      name: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string;
    role?: UserRole;
    availableRoles?: UserRole[];
    isPlatformAdmin?: boolean;
  }
}
