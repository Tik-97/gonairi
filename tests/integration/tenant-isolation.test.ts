import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { scopedPrisma } from "@/lib/db/scoped";
import { createTestOrganization, deleteTestOrganization } from "./helpers";

/**
 * The single highest-consequence bug class this app can have is one org reading or
 * mutating another org's data. This exercises the real scopedPrisma() extension
 * (lib/db/scoped.ts) end to end against the real database — not a mock — across
 * reads, writes, updates, and deletes, and across two different models, to catch a
 * regression in the extension itself (as opposed to lib/db/scoped.test.ts, which
 * only guards the model *allowlist*, not the scoping mechanism).
 */
describe("tenant isolation (scopedPrisma)", () => {
  let orgA: Awaited<ReturnType<typeof createTestOrganization>>;
  let orgB: Awaited<ReturnType<typeof createTestOrganization>>;
  let customerA: { id: string };
  let customerB: { id: string };
  let vehicleA: { id: string };

  beforeAll(async () => {
    orgA = await createTestOrganization("A");
    orgB = await createTestOrganization("B");
    // organizationId is passed here the same way every real lib/actions/*.ts caller
    // does (Prisma's generated create-input type requires it statically) — the
    // point of the next test is that the extension's own value wins regardless.
    customerA = await scopedPrisma(orgA.id).customer.create({
      data: { organizationId: orgA.id, fullName: "Org A Customer" },
    });
    customerB = await scopedPrisma(orgB.id).customer.create({
      data: { organizationId: orgB.id, fullName: "Org B Customer" },
    });
    vehicleA = await scopedPrisma(orgA.id).vehicle.create({
      data: { organizationId: orgA.id, name: "Org A Bus", capacity: 20 },
    });
  });

  afterAll(async () => {
    await deleteTestOrganization(orgA.id);
    await deleteTestOrganization(orgB.id);
  });

  it("the extension's organizationId always wins, even over a wrong value the caller passed", async () => {
    const spoofed = await scopedPrisma(orgA.id).customer.create({
      data: { organizationId: orgB.id, fullName: "Attempted Cross-Org Spoof" },
    });
    expect(spoofed.organizationId).toBe(orgA.id);
    await prisma.customer.delete({ where: { id: spoofed.id } }); // keep later findMany assertions clean
  });

  it("findMany scoped to org A includes org A's row and excludes org B's", async () => {
    const customers = await scopedPrisma(orgA.id).customer.findMany();
    const ids = customers.map((c) => c.id);
    expect(ids).toContain(customerA.id);
    expect(ids).not.toContain(customerB.id);
  });

  it("cannot read another org's row even by its exact id (IDOR-style check)", async () => {
    const result = await scopedPrisma(orgA.id).customer.findFirst({ where: { id: customerB.id } });
    expect(result).toBeNull();
  });

  it("cannot update another org's row", async () => {
    const { count } = await scopedPrisma(orgA.id).customer.updateMany({
      where: { id: customerB.id },
      data: { fullName: "Hijacked" },
    });
    expect(count).toBe(0);
    const stillOriginal = await prisma.customer.findUniqueOrThrow({ where: { id: customerB.id } });
    expect(stillOriginal.fullName).toBe("Org B Customer");
  });

  it("cannot delete another org's row", async () => {
    const { count } = await scopedPrisma(orgA.id).customer.deleteMany({ where: { id: customerB.id } });
    expect(count).toBe(0);
    const stillExists = await prisma.customer.findUnique({ where: { id: customerB.id } });
    expect(stillExists).not.toBeNull();
  });

  it("scopes a second, unrelated model (Vehicle) the same way", async () => {
    const orgBVehicles = await scopedPrisma(orgB.id).vehicle.findMany();
    expect(orgBVehicles.map((v) => v.id)).not.toContain(vehicleA.id);
  });
});
