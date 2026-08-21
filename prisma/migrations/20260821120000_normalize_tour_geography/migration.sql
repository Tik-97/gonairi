-- Normalize tour destinations into a shared ISO-backed geography catalogue.
-- The reference rows below make the migration self-contained; seed:geography
-- uses idempotent upserts to keep the same catalogue available to fresh/test DBs.

CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "iso2" VARCHAR(2) NOT NULL,
    "iso3" VARCHAR(3),
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Country_iso2_format_check" CHECK ("iso2" ~ '^[A-Z]{2}$'),
    CONSTRAINT "Country_iso3_format_check" CHECK ("iso3" IS NULL OR "iso3" ~ '^[A-Z]{3}$')
);

CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "isoCode" VARCHAR(10),
    "name" TEXT NOT NULL,
    "type" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Region_isoCode_format_check" CHECK (
        "isoCode" IS NULL OR "isoCode" ~ '^[A-Z]{2}-[A-Z0-9]{1,3}$'
    )
);

CREATE TABLE "TourRegion" (
    "tourId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourRegion_pkey" PRIMARY KEY ("tourId", "regionId"),
    CONSTRAINT "TourRegion_position_check" CHECK ("position" >= 0)
);

CREATE UNIQUE INDEX "Country_iso2_key" ON "Country"("iso2");
CREATE UNIQUE INDEX "Country_iso3_key" ON "Country"("iso3");
CREATE INDEX "Country_isActive_sortOrder_name_idx" ON "Country"("isActive", "sortOrder", "name");

CREATE UNIQUE INDEX "Region_isoCode_key" ON "Region"("isoCode");
CREATE UNIQUE INDEX "Region_countryId_name_key" ON "Region"("countryId", "name");
CREATE INDEX "Region_countryId_isActive_sortOrder_name_idx" ON "Region"("countryId", "isActive", "sortOrder", "name");

CREATE INDEX "TourRegion_regionId_tourId_idx" ON "TourRegion"("regionId", "tourId");

ALTER TABLE "Region"
    ADD CONSTRAINT "Region_countryId_fkey"
    FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TourRegion"
    ADD CONSTRAINT "TourRegion_tourId_fkey"
    FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TourRegion"
    ADD CONSTRAINT "TourRegion_regionId_fkey"
    FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Country" ("id", "iso2", "iso3", "name", "sortOrder", "updatedAt") VALUES
    ('geo-country-am', 'AM', 'ARM', 'Armenia', 10, CURRENT_TIMESTAMP),
    ('geo-country-ge', 'GE', 'GEO', 'Georgia', 20, CURRENT_TIMESTAMP);

INSERT INTO "Region" ("id", "countryId", "isoCode", "name", "type", "sortOrder", "updatedAt") VALUES
    ('geo-region-am-ag', 'geo-country-am', 'AM-AG', 'Aragatsotn', 'province', 10, CURRENT_TIMESTAMP),
    ('geo-region-am-ar', 'geo-country-am', 'AM-AR', 'Ararat', 'province', 20, CURRENT_TIMESTAMP),
    ('geo-region-am-av', 'geo-country-am', 'AM-AV', 'Armavir', 'province', 30, CURRENT_TIMESTAMP),
    ('geo-region-am-er', 'geo-country-am', 'AM-ER', 'Yerevan', 'city', 40, CURRENT_TIMESTAMP),
    ('geo-region-am-gr', 'geo-country-am', 'AM-GR', 'Gegharkunik', 'province', 50, CURRENT_TIMESTAMP),
    ('geo-region-am-kt', 'geo-country-am', 'AM-KT', 'Kotayk', 'province', 60, CURRENT_TIMESTAMP),
    ('geo-region-am-lo', 'geo-country-am', 'AM-LO', 'Lori', 'province', 70, CURRENT_TIMESTAMP),
    ('geo-region-am-sh', 'geo-country-am', 'AM-SH', 'Shirak', 'province', 80, CURRENT_TIMESTAMP),
    ('geo-region-am-su', 'geo-country-am', 'AM-SU', 'Syunik', 'province', 90, CURRENT_TIMESTAMP),
    ('geo-region-am-tv', 'geo-country-am', 'AM-TV', 'Tavush', 'province', 100, CURRENT_TIMESTAMP),
    ('geo-region-am-vd', 'geo-country-am', 'AM-VD', 'Vayots Dzor', 'province', 110, CURRENT_TIMESTAMP),
    ('geo-region-ge-ab', 'geo-country-ge', 'GE-AB', 'Abkhazia', 'autonomous republic', 10, CURRENT_TIMESTAMP),
    ('geo-region-ge-aj', 'geo-country-ge', 'GE-AJ', 'Adjara', 'autonomous republic', 20, CURRENT_TIMESTAMP),
    ('geo-region-ge-gu', 'geo-country-ge', 'GE-GU', 'Guria', 'region', 30, CURRENT_TIMESTAMP),
    ('geo-region-ge-im', 'geo-country-ge', 'GE-IM', 'Imereti', 'region', 40, CURRENT_TIMESTAMP),
    ('geo-region-ge-ka', 'geo-country-ge', 'GE-KA', 'Kakheti', 'region', 50, CURRENT_TIMESTAMP),
    ('geo-region-ge-kk', 'geo-country-ge', 'GE-KK', 'Kvemo Kartli', 'region', 60, CURRENT_TIMESTAMP),
    ('geo-region-ge-mm', 'geo-country-ge', 'GE-MM', 'Mtskheta-Mtianeti', 'region', 70, CURRENT_TIMESTAMP),
    ('geo-region-ge-rl', 'geo-country-ge', 'GE-RL', 'Racha-Lechkhumi and Kvemo Svaneti', 'region', 80, CURRENT_TIMESTAMP),
    ('geo-region-ge-sj', 'geo-country-ge', 'GE-SJ', 'Samtskhe-Javakheti', 'region', 90, CURRENT_TIMESTAMP),
    ('geo-region-ge-sk', 'geo-country-ge', 'GE-SK', 'Shida Kartli', 'region', 100, CURRENT_TIMESTAMP),
    ('geo-region-ge-sz', 'geo-country-ge', 'GE-SZ', 'Samegrelo-Zemo Svaneti', 'region', 110, CURRENT_TIMESTAMP),
    ('geo-region-ge-tb', 'geo-country-ge', 'GE-TB', 'Tbilisi', 'city', 120, CURRENT_TIMESTAMP);

-- The previous UI offered the whole country "Georgia" as a region. Preserve
-- that historical meaning in an inactive placeholder so no existing tour is
-- silently assigned to an arbitrary Georgian subdivision. It is not offered
-- for new selections and intentionally has no ISO 3166-2 code.
INSERT INTO "Region" (
    "id", "countryId", "isoCode", "name", "type", "isActive", "sortOrder", "updatedAt"
) VALUES (
    'geo-region-ge-legacy', 'geo-country-ge', NULL, 'Georgia (region unspecified)',
    'legacy country selection', false, 999, CURRENT_TIMESTAMP
);

-- Refuse to drop legacy data if an unknown value entered the old free-form
-- String[] column. The known picker values are mapped below.
DO $$
DECLARE
    unknown_regions TEXT;
BEGIN
    SELECT string_agg(DISTINCT legacy.name, ', ' ORDER BY legacy.name)
    INTO unknown_regions
    FROM "Tour" AS tour
    CROSS JOIN LATERAL unnest(tour."regions") AS legacy(name)
    WHERE NOT EXISTS (
        SELECT 1
        FROM "Region" AS region
        WHERE (region."countryId" = 'geo-country-am' AND lower(region."name") = lower(legacy.name))
           OR (lower(legacy.name) = 'georgia' AND region."id" = 'geo-region-ge-legacy')
    );

    IF unknown_regions IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot migrate unknown Tour.regions values: %', unknown_regions;
    END IF;
END $$;

INSERT INTO "TourRegion" ("tourId", "regionId", "position")
SELECT
    tour."id",
    region."id",
    legacy.position::INTEGER - 1
FROM "Tour" AS tour
CROSS JOIN LATERAL unnest(tour."regions") WITH ORDINALITY AS legacy(name, position)
JOIN "Region" AS region
    ON (region."countryId" = 'geo-country-am' AND lower(region."name") = lower(legacy.name))
    OR (lower(legacy.name) = 'georgia' AND region."id" = 'geo-region-ge-legacy')
ON CONFLICT ("tourId", "regionId") DO NOTHING;

ALTER TABLE "Tour" DROP COLUMN "regions";
