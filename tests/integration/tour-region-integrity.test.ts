import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createTestOrganization, deleteTestOrganization } from "./helpers";

describe("TourRegion database integrity", () => {
  let organization: Awaited<ReturnType<typeof createTestOrganization>>;

  beforeAll(async () => {
    organization = await createTestOrganization("Tour Region Integrity");
  });

  afterAll(async () => {
    await deleteTestOrganization(organization.id);
  });

  it("rejects a tour with no region relationship", async () => {
    await expect(
      prisma.tour.create({
        data: {
          organizationId: organization.id,
          title: "Missing Region",
          slug: "missing-region",
          basePrice: 100,
          languagesOffered: [],
          images: [],
        },
      }),
    ).rejects.toThrow(/must have at least one region/i);
  });

  it("accepts nested region creation and rejects removal of the last link", async () => {
    const tour = await prisma.tour.create({
      data: {
        organizationId: organization.id,
        title: "Valid Region",
        slug: "valid-region",
        basePrice: 100,
        languagesOffered: [],
        images: [],
        tourRegions: {
          create: { region: { connect: { isoCode: "AM-ER" } }, position: 0 },
        },
      },
      include: { tourRegions: true },
    });

    expect(tour.tourRegions).toHaveLength(1);
    await expect(
      prisma.tourRegion.delete({
        where: { tourId_regionId: { tourId: tour.id, regionId: tour.tourRegions[0].regionId } },
      }),
    ).rejects.toThrow(/must have at least one region/i);

    expect(await prisma.tourRegion.count({ where: { tourId: tour.id } })).toBe(1);
  });
});
