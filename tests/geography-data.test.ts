import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

type LoadedGeography = {
  countries: Array<{
    iso2: string;
    name: string;
    regions: Array<{ id: string; isoCode: string | null; name: string }>;
  }>;
  sourceSha256: string;
  totalRegions: number;
  regionsWithoutIsoCode: number;
};

const require = createRequire(import.meta.url);
const { loadGeography } = require("../scripts/geography-data.cjs") as {
  loadGeography: () => LoadedGeography;
};

describe("geography seed source", () => {
  it("loads every supplied country and region", () => {
    const geography = loadGeography();

    expect(geography.countries).toHaveLength(249);
    expect(geography.totalRegions).toBe(4_387);
    expect(geography.regionsWithoutIsoCode).toBe(179);
    expect(geography.sourceSha256).toBe(
      "4cec4088d41e70e49dcbb9a1e2ca7806aae263c305dc2c8d34a462bb214f3b6b",
    );
  });

  it("normalizes suffix and already-prefixed codes without inventing missing codes", () => {
    const geography = loadGeography();
    const armenia = geography.countries.find((country) => country.iso2 === "AM");
    const denmark = geography.countries.find((country) => country.iso2 === "DK");
    const cookIslands = geography.countries.find((country) => country.iso2 === "CK");

    expect(armenia?.regions.find((region) => region.name === "Yerevan")?.isoCode).toBe("AM-ER");
    expect(denmark?.regions.find((region) => region.name === "Hovedstaden")?.isoCode).toBe("DK-84");
    expect(cookIslands?.regions.find((region) => region.name === "Aitutaki")?.isoCode).toBeNull();
  });
});
