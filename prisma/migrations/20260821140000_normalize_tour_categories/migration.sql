-- Replace Tour.category free text with a normalized, multi-value hashtag catalogue.

CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Category_slug_format_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE "TourCategory" (
    "tourId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourCategory_pkey" PRIMARY KEY ("tourId", "categoryId"),
    CONSTRAINT "TourCategory_position_check" CHECK ("position" >= 0)
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_isActive_sortOrder_label_idx" ON "Category"("isActive", "sortOrder", "label");
CREATE UNIQUE INDEX "TourCategory_tourId_position_key" ON "TourCategory"("tourId", "position");
CREATE INDEX "TourCategory_categoryId_tourId_idx" ON "TourCategory"("categoryId", "tourId");

ALTER TABLE "TourCategory"
    ADD CONSTRAINT "TourCategory_tourId_fkey"
    FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TourCategory"
    ADD CONSTRAINT "TourCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Core values cover the previous hardcoded picker and all demo values. The
-- full catalogue is maintained by seed:categories / prisma db seed.
INSERT INTO "Category" ("id", "slug", "label", "sortOrder", "updatedAt") VALUES
    ('category-cultural', 'cultural', 'Cultural', 10, CURRENT_TIMESTAMP),
    ('category-history', 'history', 'History', 20, CURRENT_TIMESTAMP),
    ('category-religious', 'religious', 'Religious', 30, CURRENT_TIMESTAMP),
    ('category-nature', 'nature', 'Nature', 40, CURRENT_TIMESTAMP),
    ('category-hiking', 'hiking', 'Hiking', 50, CURRENT_TIMESTAMP),
    ('category-adventure', 'adventure', 'Adventure', 60, CURRENT_TIMESTAMP),
    ('category-wine', 'wine', 'Wine', 70, CURRENT_TIMESTAMP),
    ('category-food', 'food', 'Food', 80, CURRENT_TIMESTAMP),
    ('category-culinary', 'culinary', 'Culinary', 90, CURRENT_TIMESTAMP),
    ('category-city', 'city', 'City', 100, CURRENT_TIMESTAMP),
    ('category-wildlife', 'wildlife', 'Wildlife', 110, CURRENT_TIMESTAMP),
    ('category-photography', 'photography', 'Photography', 120, CURRENT_TIMESTAMP),
    ('category-family', 'family', 'Family', 130, CURRENT_TIMESTAMP),
    ('category-day-trip', 'day-trip', 'Day Trip', 140, CURRENT_TIMESTAMP),
    ('category-multi-day', 'multi-day', 'Multi-day', 150, CURRENT_TIMESTAMP);

-- Preserve any custom legacy values as inactive categories rather than losing
-- data or silently mapping an unknown value to the wrong hashtag.
INSERT INTO "Category" (
    "id", "slug", "label", "isActive", "sortOrder", "updatedAt"
)
SELECT
    'category-legacy-' || md5(legacy.normalized),
    'legacy-' || substring(md5(legacy.normalized), 1, 16),
    legacy.label,
    false,
    9999,
    CURRENT_TIMESTAMP
FROM (
    SELECT lower(trim("category")) AS normalized, min(trim("category")) AS label
    FROM "Tour"
    WHERE "category" IS NOT NULL AND trim("category") <> ''
      AND lower(trim("category")) NOT IN (
        'cultural', 'history', 'historical', 'religious', 'nature', 'hiking',
        'adventure', 'wine', 'food', 'culinary', 'city', 'wildlife',
        'photography', 'family', 'day-trip', 'multi-day'
      )
    GROUP BY lower(trim("category"))
) AS legacy
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "TourCategory" ("tourId", "categoryId", "position")
SELECT
    tour."id",
    category."id",
    0
FROM "Tour" AS tour
JOIN "Category" AS category ON category."slug" = CASE lower(trim(tour."category"))
    WHEN 'historical' THEN 'history'
    WHEN 'cultural' THEN 'cultural'
    WHEN 'history' THEN 'history'
    WHEN 'religious' THEN 'religious'
    WHEN 'nature' THEN 'nature'
    WHEN 'hiking' THEN 'hiking'
    WHEN 'adventure' THEN 'adventure'
    WHEN 'wine' THEN 'wine'
    WHEN 'food' THEN 'food'
    WHEN 'culinary' THEN 'culinary'
    WHEN 'city' THEN 'city'
    WHEN 'wildlife' THEN 'wildlife'
    WHEN 'photography' THEN 'photography'
    WHEN 'family' THEN 'family'
    WHEN 'day-trip' THEN 'day-trip'
    WHEN 'multi-day' THEN 'multi-day'
    ELSE 'legacy-' || substring(md5(lower(trim(tour."category"))), 1, 16)
END
WHERE tour."category" IS NOT NULL AND trim(tour."category") <> '';

ALTER TABLE "Tour" DROP COLUMN "category";
