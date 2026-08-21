const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const SOURCE_PATH = path.join(__dirname, "..", "data", "geography", "countries-and-regions.json");

function countryIdFor(iso2) {
  return `geo-country-${iso2.toLowerCase()}`;
}

function regionIdFor(countryIso2, name, isoCode) {
  if (isoCode) return `geo-region-${isoCode.toLowerCase()}`;
  const digest = crypto.createHash("sha256").update(`${countryIso2}\0${name}`).digest("hex").slice(0, 20);
  return `geo-region-${countryIso2.toLowerCase()}-${digest}`;
}

function normalizeIsoCode(countryIso2, shortCode) {
  if (shortCode === undefined || shortCode === null || String(shortCode).trim() === "") return null;

  const normalizedShortCode = String(shortCode).trim().toUpperCase();
  const isoCode = normalizedShortCode.startsWith(`${countryIso2}-`)
    ? normalizedShortCode
    : `${countryIso2}-${normalizedShortCode}`;

  if (!/^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(isoCode)) {
    throw new Error(`Invalid subdivision code "${shortCode}" for country ${countryIso2}.`);
  }

  return isoCode;
}

function loadGeography() {
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  const parsed = JSON.parse(source);
  if (!Array.isArray(parsed)) throw new Error("Geography source must be a JSON array.");

  const countryCodes = new Set();
  const regionCodes = new Set();
  const regionIds = new Set();
  let totalRegions = 0;
  let regionsWithoutIsoCode = 0;

  const countries = parsed.map((sourceCountry, countryIndex) => {
    const name = typeof sourceCountry.countryName === "string" ? sourceCountry.countryName.trim() : "";
    const iso2 =
      typeof sourceCountry.countryShortCode === "string"
        ? sourceCountry.countryShortCode.trim().toUpperCase()
        : "";

    if (!name) throw new Error(`Country at index ${countryIndex} has no name.`);
    if (!/^[A-Z]{2}$/.test(iso2)) throw new Error(`Invalid country code for ${name}: ${iso2 || "missing"}.`);
    if (countryCodes.has(iso2)) throw new Error(`Duplicate country code: ${iso2}.`);
    if (!Array.isArray(sourceCountry.regions)) throw new Error(`Country ${iso2} has no regions array.`);
    countryCodes.add(iso2);

    const namesInCountry = new Set();
    const regions = sourceCountry.regions.map((sourceRegion, regionIndex) => {
      const regionName = typeof sourceRegion.name === "string" ? sourceRegion.name.trim() : "";
      if (!regionName) throw new Error(`Region ${regionIndex} in ${iso2} has no name.`);
      if (namesInCountry.has(regionName)) throw new Error(`Duplicate region name in ${iso2}: ${regionName}.`);
      namesInCountry.add(regionName);

      const isoCode = normalizeIsoCode(iso2, sourceRegion.shortCode);
      if (isoCode && regionCodes.has(isoCode)) throw new Error(`Duplicate subdivision code: ${isoCode}.`);
      if (isoCode) regionCodes.add(isoCode);
      else regionsWithoutIsoCode += 1;

      const id = regionIdFor(iso2, regionName, isoCode);
      if (regionIds.has(id)) throw new Error(`Duplicate generated region ID: ${id}.`);
      regionIds.add(id);
      totalRegions += 1;

      return {
        id,
        countryIso2: iso2,
        isoCode,
        name: regionName,
        sortOrder: (regionIndex + 1) * 10,
      };
    });

    return {
      id: countryIdFor(iso2),
      iso2,
      name,
      sortOrder: (countryIndex + 1) * 10,
      regions,
    };
  });

  return {
    countries,
    sourcePath: SOURCE_PATH,
    sourceSha256: crypto.createHash("sha256").update(source).digest("hex"),
    totalRegions,
    regionsWithoutIsoCode,
  };
}

module.exports = { SOURCE_PATH, loadGeography };
