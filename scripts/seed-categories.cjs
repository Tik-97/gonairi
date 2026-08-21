// Idempotently seed the global tour hashtag catalogue.
// Usage: npm run seed:categories
require("dotenv/config");

const { Client } = require("pg");
const { CATEGORIES } = require("./category-data.cjs");

function validateCategories() {
  const slugs = new Set();
  for (const category of CATEGORIES) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(category.slug)) {
      throw new Error(`Invalid category slug: ${category.slug}`);
    }
    if (!category.label.trim()) throw new Error(`Category ${category.slug} has no label.`);
    if (slugs.has(category.slug)) throw new Error(`Duplicate category slug: ${category.slug}`);
    slugs.add(category.slug);
  }
}

async function seedCategories(client) {
  validateCategories();

  await client.query(`
    CREATE TEMP TABLE "_CategorySeed" (
      "id" TEXT NOT NULL,
      "slug" VARCHAR(50) NOT NULL PRIMARY KEY,
      "label" TEXT NOT NULL,
      "sortOrder" INTEGER NOT NULL
    ) ON COMMIT DROP
  `);

  const values = [];
  const placeholders = CATEGORIES.map((category) => {
    const offset = values.length;
    values.push(category.id, category.slug, category.label, category.sortOrder);
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
  });
  await client.query(
    `INSERT INTO "_CategorySeed" ("id", "slug", "label", "sortOrder")
     VALUES ${placeholders.join(", ")}`,
    values,
  );

  await client.query(`
    INSERT INTO "Category" (
      "id", "slug", "label", "isActive", "sortOrder", "createdAt", "updatedAt"
    )
    SELECT seed."id", seed."slug", seed."label", true, seed."sortOrder", now(), now()
    FROM "_CategorySeed" AS seed
    ON CONFLICT ("slug") DO UPDATE SET
      "label" = EXCLUDED."label",
      "isActive" = true,
      "sortOrder" = EXCLUDED."sortOrder",
      "updatedAt" = EXCLUDED."updatedAt"
  `);

  // Keep removed/legacy rows for existing TourCategory foreign keys, but hide
  // them from new selections.
  await client.query(`
    UPDATE "Category" AS category
    SET "isActive" = false, "updatedAt" = now()
    WHERE category."isActive" = true
      AND NOT EXISTS (
        SELECT 1 FROM "_CategorySeed" AS seed WHERE seed."slug" = category."slug"
      )
  `);

  return { categoryCount: CATEGORIES.length };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add it to .env before seeding.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("BEGIN");

  try {
    const result = await seedCategories(client);
    await client.query("COMMIT");
    console.log(`Categories seeded successfully: ${result.categoryCount} hashtags.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Category seed failed:", error);
    process.exit(1);
  });
}

module.exports = { seedCategories };
