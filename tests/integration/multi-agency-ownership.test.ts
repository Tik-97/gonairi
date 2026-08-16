import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createTestOrganization, deleteTestOrganization } from "./helpers";

describe("multi-agency ownership", () => {
  let primaryAgency: Awaited<ReturnType<typeof createTestOrganization>>;
  let secondAgencyId: string;

  beforeAll(async () => {
    primaryAgency = await createTestOrganization("Multi Owner");
    const secondAgency = await prisma.organization.create({
      data: {
        name: `Vitest Second Agency ${Date.now()}`,
        slug: `vitest-second-agency-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ownerId: primaryAgency.ownerId,
      },
    });
    secondAgencyId = secondAgency.id;
  });

  afterAll(async () => {
    await prisma.organization.delete({ where: { id: secondAgencyId } });
    await deleteTestOrganization(primaryAgency.id);
  });

  it("allows one Owner user to own more than one agency", async () => {
    const owner = await prisma.user.findUniqueOrThrow({
      where: { id: primaryAgency.ownerId },
      include: {
        ownedOrganizations: {
          orderBy: { createdAt: "asc" },
          select: { id: true },
        },
      },
    });

    expect(owner.roles).toContain("OWNER");
    expect(owner.ownedOrganizations.map((organization) => organization.id)).toEqual(
      expect.arrayContaining([primaryAgency.id, secondAgencyId]),
    );
  });
});
