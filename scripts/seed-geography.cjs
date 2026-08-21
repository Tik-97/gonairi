// Idempotently import the versioned country/region catalogue into PostgreSQL.
// Usage: npm run seed:geography
require("dotenv/config");

const { Client } = require("pg");
const { loadGeography } = require("./geography-data.cjs");

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function insertRows(client, table, columns, rows) {
  if (rows.length === 0) return;
  const chunkSize = Math.max(1, Math.floor(30_000 / columns.length));

  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const values = [];
    const placeholders = chunk.map((row) =>
      `(${row
        .map((value) => {
          values.push(value);
          return `$${values.length}`;
        })
        .join(", ")})`,
    );

    await client.query(
      `INSERT INTO ${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(", ")})
       VALUES ${placeholders.join(", ")}`,
      values,
    );
  }
}

async function seedGeography(client) {
  const geography = loadGeography();
  const countryRows = geography.countries.map((country) => [
    country.id,
    country.iso2,
    country.name,
    country.sortOrder,
  ]);
  const regionRows = geography.countries.flatMap((country) =>
    country.regions.map((region) => [
      region.id,
      region.countryIso2,
      region.isoCode,
      region.name,
      region.sortOrder,
    ]),
  );

  await client.query(`
    CREATE TEMP TABLE "_GeographyCountrySeed" (
      "id" TEXT NOT NULL,
      "iso2" VARCHAR(2) NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "sortOrder" INTEGER NOT NULL
    ) ON COMMIT DROP
  `);
  await client.query(`
    CREATE TEMP TABLE "_GeographyRegionSeed" (
      "id" TEXT NOT NULL,
      "countryIso2" VARCHAR(2) NOT NULL,
      "isoCode" VARCHAR(10),
      "name" TEXT NOT NULL,
      "sortOrder" INTEGER NOT NULL
    ) ON COMMIT DROP
  `);

  await insertRows(
    client,
    "_GeographyCountrySeed",
    ["id", "iso2", "name", "sortOrder"],
    countryRows,
  );
  await insertRows(
    client,
    "_GeographyRegionSeed",
    ["id", "countryIso2", "isoCode", "name", "sortOrder"],
    regionRows,
  );

  await client.query(`
    INSERT INTO "Country" (
      "id", "iso2", "iso3", "name", "isActive", "sortOrder", "createdAt", "updatedAt"
    )
    SELECT seed."id", seed."iso2", NULL, seed."name", true, seed."sortOrder", now(), now()
    FROM "_GeographyCountrySeed" AS seed
    ON CONFLICT ("iso2") DO UPDATE SET
      "name" = EXCLUDED."name",
      "isActive" = true,
      "sortOrder" = EXCLUDED."sortOrder",
      "updatedAt" = EXCLUDED."updatedAt"
  `);

  await client.query(`
    INSERT INTO "Region" (
      "id", "countryId", "isoCode", "name", "type", "isActive", "sortOrder", "createdAt", "updatedAt"
    )
    SELECT seed."id", country."id", seed."isoCode", seed."name", NULL, true, seed."sortOrder", now(), now()
    FROM "_GeographyRegionSeed" AS seed
    JOIN "Country" AS country ON country."iso2" = seed."countryIso2"
    WHERE seed."isoCode" IS NOT NULL
    ON CONFLICT ("isoCode") DO UPDATE SET
      "countryId" = EXCLUDED."countryId",
      "name" = EXCLUDED."name",
      "isActive" = true,
      "sortOrder" = EXCLUDED."sortOrder",
      "updatedAt" = EXCLUDED."updatedAt"
  `);

  await client.query(`
    INSERT INTO "Region" (
      "id", "countryId", "isoCode", "name", "type", "isActive", "sortOrder", "createdAt", "updatedAt"
    )
    SELECT seed."id", country."id", NULL, seed."name", NULL, true, seed."sortOrder", now(), now()
    FROM "_GeographyRegionSeed" AS seed
    JOIN "Country" AS country ON country."iso2" = seed."countryIso2"
    WHERE seed."isoCode" IS NULL
    ON CONFLICT ("countryId", "name") DO UPDATE SET
      "isActive" = true,
      "sortOrder" = EXCLUDED."sortOrder",
      "updatedAt" = EXCLUDED."updatedAt"
  `);

  // Rows removed from a future source file are retained for referential safety
  // but hidden from new selections. Existing TourRegion links remain valid.
  await client.query(`
    UPDATE "Region" AS region
    SET "isActive" = false, "updatedAt" = now()
    WHERE region."isActive" = true
      AND NOT EXISTS (
        SELECT 1
        FROM "_GeographyRegionSeed" AS seed
        JOIN "Country" AS country ON country."iso2" = seed."countryIso2"
        WHERE (seed."isoCode" IS NOT NULL AND seed."isoCode" = region."isoCode")
           OR (
             seed."isoCode" IS NULL
             AND region."isoCode" IS NULL
             AND country."id" = region."countryId"
             AND seed."name" = region."name"
           )
      )
  `);
  await client.query(`
    UPDATE "Country" AS country
    SET "isActive" = false, "updatedAt" = now()
    WHERE country."isActive" = true
      AND NOT EXISTS (
        SELECT 1 FROM "_GeographyCountrySeed" AS seed WHERE seed."iso2" = country."iso2"
      )
  `);

  return {
    countryCount: geography.countries.length,
    regionCount: geography.totalRegions,
    regionsWithoutIsoCode: geography.regionsWithoutIsoCode,
    sourceSha256: geography.sourceSha256,
  };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add it to .env before seeding.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("BEGIN");

  try {
    const result = await seedGeography(client);
    await client.query("COMMIT");
    console.log(
      `Geography seeded successfully: ${result.countryCount} countries, ${result.regionCount} regions ` +
        `(${result.regionsWithoutIsoCode} without ISO codes).`,
    );
    console.log(`Source SHA-256: ${result.sourceSha256}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Geography seed failed:", error);
    process.exit(1);
  });
}

module.exports = { seedGeography };
