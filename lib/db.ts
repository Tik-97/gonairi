import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Raw, unscoped client. Only for: public marketplace reads (always filtered to
// isPublished/isPublic in the query itself), shared geography reference reads,
// and platform-admin tooling.
// Back-office code paths must use `scopedPrisma` from lib/db/scoped.ts instead.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
