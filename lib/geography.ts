import "server-only";

import { prisma } from "@/lib/db";
import type { GeographyCountryOption, GeographyRegionOption } from "@/types/geography";

export async function listCountryOptions(): Promise<GeographyCountryOption[]> {
  return prisma.country.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, iso2: true, name: true },
  });
}

/** Active choices for one country, plus explicitly requested legacy rows. */
export async function listRegionOptions(
  countryId: string,
  selectedRegionIds: string[] = [],
): Promise<GeographyRegionOption[]> {
  const selectedWhere = selectedRegionIds.length > 0 ? { id: { in: selectedRegionIds } } : undefined;

  return prisma.region.findMany({
    where: {
      countryId,
      ...(selectedWhere ? { OR: [{ isActive: true }, selectedWhere] } : { isActive: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      countryId: true,
      isoCode: true,
      name: true,
      type: true,
      isActive: true,
    },
  });
}

export async function getRegionOptionByIsoCode(
  isoCode: string | undefined,
): Promise<GeographyRegionOption | null> {
  if (!isoCode) return null;

  return prisma.region.findFirst({
    where: { isoCode, isActive: true, country: { isActive: true } },
    select: {
      id: true,
      countryId: true,
      isoCode: true,
      name: true,
      type: true,
      isActive: true,
    },
  });
}

export async function getRegionOptionById(
  regionId: string | undefined,
): Promise<GeographyRegionOption | null> {
  if (!regionId || regionId.length > 100) return null;

  return prisma.region.findFirst({
    where: { id: regionId, isActive: true, country: { isActive: true } },
    select: {
      id: true,
      countryId: true,
      isoCode: true,
      name: true,
      type: true,
      isActive: true,
    },
  });
}
