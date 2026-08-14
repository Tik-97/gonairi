import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { roleHasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/auth/permission-keys";

/**
 * roleHasPermission() resolves from the RolePermission table (editable live from the
 * Super Admin dashboard), memoized only per-request via React.cache() — never across
 * requests. This exercises that DB round trip for real, confirming a write is visible
 * on the very next call — the exact property /admin/roles depends on.
 *
 * Mutates and then restores OPERATOR's real grants (captured in beforeAll) rather than
 * asserting today's specific default set, since that set is meant to be editable and
 * a rigid snapshot would make this test fail the moment someone legitimately changes it.
 */
describe("roleHasPermission (RBAC, DB-backed)", () => {
  let originalOperatorGrants: string[];

  beforeAll(async () => {
    originalOperatorGrants = (await prisma.rolePermission.findMany({ where: { role: "OPERATOR" } })).map(
      (r) => r.permission,
    );
  });

  afterAll(async () => {
    await prisma.rolePermission.deleteMany({ where: { role: "OPERATOR" } });
    if (originalOperatorGrants.length > 0) {
      await prisma.rolePermission.createMany({
        data: originalOperatorGrants.map((permission) => ({ role: "OPERATOR" as const, permission })),
      });
    }
  });

  it("reflects a freshly revoked permission on the very next call", async () => {
    await prisma.rolePermission.deleteMany({
      where: { role: "OPERATOR", permission: PERMISSIONS.customersManage },
    });
    expect(await roleHasPermission("OPERATOR", PERMISSIONS.customersManage)).toBe(false);
  });

  it("reflects a freshly granted permission on the very next call", async () => {
    await prisma.rolePermission.upsert({
      where: { role_permission: { role: "OPERATOR", permission: PERMISSIONS.customersManage } },
      create: { role: "OPERATOR", permission: PERMISSIONS.customersManage },
      update: {},
    });
    expect(await roleHasPermission("OPERATOR", PERMISSIONS.customersManage)).toBe(true);
  });

  it("DRIVER never holds a back-office permission it wasn't explicitly granted", async () => {
    expect(await roleHasPermission("DRIVER", PERMISSIONS.customersView)).toBe(false);
  });

  it("GUIDE never holds a back-office permission it wasn't explicitly granted", async () => {
    expect(await roleHasPermission("GUIDE", PERMISSIONS.bookingsView)).toBe(false);
  });

  it("DRIVER_GUIDE never holds a back-office permission it wasn't explicitly granted", async () => {
    expect(await roleHasPermission("DRIVER_GUIDE", PERMISSIONS.customersView)).toBe(false);
  });

  it("an unrecognized permission string is never treated as granted, for any role", async () => {
    // @ts-expect-error deliberately outside the Permission union — proves the runtime
    // check doesn't accidentally match on an unexpected/garbage value.
    expect(await roleHasPermission("OWNER", "not:a:real:permission")).toBe(false);
  });
});
