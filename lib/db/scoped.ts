import "server-only";
import { prisma } from "@/lib/db";

/**
 * Models that carry an `organizationId` column and must never leak across tenants.
 * Every model added to the schema that belongs to a single Organization must be
 * listed here, or scopedPrisma() will silently pass its queries through unscoped.
 *
 * Exported (only) so lib/db/scoped.test.ts can assert this set exactly matches every
 * model in prisma/schema.prisma that actually has an `organizationId` field — a
 * forgotten entry here would otherwise leak data cross-tenant with no signal until
 * someone happens to notice.
 */
export const TENANT_SCOPED_MODELS = new Set([
  "User",
  "Customer",
  "Tour",
  "TourCustomer",
  "Departure",
  "DepartureVehicle",
  "Booking",
  "BookingTraveler",
  "Vehicle",
  "Payment",
  "Attendance",
]);

const READ_WHERE_OPERATIONS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

const WRITE_WHERE_OPERATIONS = new Set([
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

/**
 * Returns a Prisma client that transparently scopes every tenant-scoped model
 * to a single organization: injects `organizationId` into `where` on reads/updates/
 * deletes, and stamps it onto `data` on creates. This is the ONLY way back-office
 * code should touch the database — never import the raw `prisma` client from
 * lib/db.ts inside app/(dashboard) server actions/route handlers.
 *
 * `organizationId` must come from the authenticated session, never from client input.
 */
export function scopedPrisma(organizationId: string) {
  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_SCOPED_MODELS.has(model)) {
            return query(args);
          }

          const a = args as Record<string, unknown>;

          if (READ_WHERE_OPERATIONS.has(operation) || WRITE_WHERE_OPERATIONS.has(operation)) {
            a.where = { ...(a.where as object | undefined), organizationId };
          } else if (operation === "create") {
            a.data = { ...(a.data as object), organizationId };
          } else if (operation === "createMany") {
            const data = a.data;
            a.data = Array.isArray(data)
              ? data.map((d) => ({ ...d, organizationId }))
              : data;
          } else if (operation === "upsert") {
            a.where = { ...(a.where as object | undefined), organizationId };
            a.create = { ...(a.create as object), organizationId };
          }

          return query(a);
        },
      },
    },
  });
}

export type ScopedPrisma = ReturnType<typeof scopedPrisma>;
