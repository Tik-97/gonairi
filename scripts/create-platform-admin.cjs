// One-off CLI to create/update a platform-level Super Admin account.
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

  const passwordHash = await bcrypt.hash(password, 10);
  await client.query(
    `INSERT INTO "PlatformAdmin" ("id", "email", "passwordHash", "name", "updatedAt")
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT ("email") DO UPDATE SET "passwordHash" = $3, "name" = $4, "updatedAt" = now()`,
    [randomUUID(), email, passwordHash, name],
  );

  console.log("Platform admin ready:", email);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
