// Main Prisma seed entry point. Configured in prisma.config.ts so both
// `npx prisma db seed` and `npm run db:seed` execute the same workflow.
require("dotenv/config");

const bcrypt = require("bcryptjs");
const { randomUUID } = require("node:crypto");
const { Client } = require("pg");
const { seedCategories } = require("./seed-categories.cjs");
const { seedGeography } = require("./seed-geography.cjs");

const DEFAULT_ADMIN_EMAIL = "admin@test.com";
const DEFAULT_ADMIN_PASSWORD = "password";
const DEFAULT_ADMIN_NAME = "Platform Admin";

function platformAdminSeedConfig() {
  const email = (process.env.SEED_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const name = (process.env.SEED_ADMIN_NAME || DEFAULT_ADMIN_NAME).trim();

  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("SEED_ADMIN_EMAIL must be a valid email address.");
  if (password.length < 8) throw new Error("SEED_ADMIN_PASSWORD must contain at least 8 characters.");
  if (!name) throw new Error("SEED_ADMIN_NAME cannot be empty.");

  const usesInsecureDefaults = email === DEFAULT_ADMIN_EMAIL || password === DEFAULT_ADMIN_PASSWORD;
  if (process.env.NODE_ENV === "production" && usesInsecureDefaults) {
    throw new Error(
      "Refusing to seed the public development admin credentials in production. " +
        "Set secure SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD values.",
    );
  }

  return { email, password, name };
}

async function seedPlatformAdmin(client) {
  // Serialize concurrent seed attempts because PlatformAdmin is intentionally
  // a singleton at the application level.
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["gonairi:platform-admin-seed"]);
  const existing = await client.query(
    `SELECT "email" FROM "PlatformAdmin" ORDER BY "createdAt" ASC LIMIT 1`,
  );

  if (existing.rowCount > 0) {
    const requestedEmail = (process.env.SEED_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
    return {
      created: false,
      email: existing.rows[0].email,
      requestedEmail,
    };
  }

  const config = platformAdminSeedConfig();
  const passwordHash = await bcrypt.hash(config.password, 10);
  await client.query(
    `INSERT INTO "PlatformAdmin" (
       "id", "email", "passwordHash", "name", "createdAt", "updatedAt"
     ) VALUES ($1, $2, $3, $4, now(), now())`,
    [randomUUID(), config.email, passwordHash, config.name],
  );

  return { created: true, email: config.email, requestedEmail: config.email };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add it to .env before seeding.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("BEGIN");

  try {
    const geography = await seedGeography(client);
    const categories = await seedCategories(client);
    const admin = await seedPlatformAdmin(client);
    await client.query("COMMIT");

    console.log(
      `Geography seeded: ${geography.countryCount} countries, ${geography.regionCount} regions.`,
    );
    console.log(`Categories seeded: ${categories.categoryCount} hashtags.`);
    if (admin.created) {
      console.log(`Platform Admin created: ${admin.email}`);
    } else {
      console.log(`Platform Admin already exists: ${admin.email}. Password was not changed.`);
      if (admin.email !== admin.requestedEmail) {
        console.log(`Configured seed account ${admin.requestedEmail} was not created.`);
      }
    }
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Database seed failed:", error);
    process.exit(1);
  });
}

module.exports = { platformAdminSeedConfig, seedPlatformAdmin };
