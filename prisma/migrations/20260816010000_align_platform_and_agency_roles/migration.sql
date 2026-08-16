-- The platform Super Admin is stored separately in PlatformAdmin. Tenant
-- accounts no longer use ADMIN; existing tenant admins become operators.
UPDATE "User" SET "role" = 'OPERATOR' WHERE "role" = 'ADMIN';
DELETE FROM "RolePermission" WHERE "role" = 'ADMIN';

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;
ALTER TABLE "RolePermission" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;

DROP TYPE "UserRole";
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'OPERATOR', 'DRIVER', 'GUIDE', 'DRIVER_GUIDE');

ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
ALTER TABLE "RolePermission" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OPERATOR';

-- Owners always have full agency access. Application code also enforces this
-- invariant, while these rows keep the permission matrix explicit in the DB.
INSERT INTO "RolePermission" ("id", "role", "permission")
SELECT gen_random_uuid()::text, 'OWNER'::"UserRole", permission
FROM (VALUES
  ('tours:view'), ('tours:manage'), ('tours:delete'),
  ('departures:manage'), ('departures:delete'),
  ('bookings:view'), ('bookings:manage'),
  ('customers:view'), ('customers:manage'), ('customers:delete'),
  ('vehicles:view'), ('vehicles:manage'), ('vehicles:delete'),
  ('staff:view'), ('staff:manage'), ('attendance:manage'),
  ('finances:view'), ('finances:manage'),
  ('schedule:view-own'), ('org:settings-manage')
) AS permissions(permission)
ON CONFLICT ("role", "permission") DO NOTHING;
