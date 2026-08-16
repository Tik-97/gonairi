// One-off CLI to create the single platform-level Super Admin account.
// Usage: node scripts/create-platform-admin.cjs <email> <password> <name>
require("dotenv/config");
const bcrypt = require("bcryptjs");
const { Client } = require("pg");
const { randomUUID } = require("node:crypto");

async function main() {
  const [, , email, password, name] = process.argv;
  if (!email || !password || !name) {
    console.error("Usage: node scripts/create-platform-admin.cjs <email> <password> <name>");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const existing = await client.query(`SELECT "email" FROM "PlatformAdmin" LIMIT 1`);
  if (existing.rowCount > 0) {
    console.error(`A platform Super Admin already exists (${existing.rows[0].email}). Refusing to create or overwrite it.`);
    await client.end();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await client.query(
    `INSERT INTO "PlatformAdmin" ("id", "email", "passwordHash", "name", "updatedAt")
     VALUES ($1, $2, $3, $4, now())`,
    [randomUUID(), email, passwordHash, name],
  );

  console.log("Platform Super Admin created:", email);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
