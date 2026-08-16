-- Users may be created before they are assigned as the owner of their first
-- agency. Their ordinary staff organization is therefore optional and is kept
-- separate from the agencies they own.
ALTER TABLE "User" DROP CONSTRAINT "User_organizationId_fkey";
ALTER TABLE "User" ALTER COLUMN "organizationId" DROP NOT NULL;
ALTER TABLE "User"
ADD CONSTRAINT "User_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill the designated owner from the OWNER user every existing agency was
-- created with under the previous model.
ALTER TABLE "Organization" ADD COLUMN "ownerId" TEXT;

UPDATE "Organization" AS organization
SET "ownerId" = (
  SELECT app_user."id"
  FROM "User" AS app_user
  WHERE app_user."organizationId" = organization."id"
    AND app_user."roles" @> ARRAY['OWNER']::"UserRole"[]
  ORDER BY app_user."createdAt" ASC
  LIMIT 1
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Organization" WHERE "ownerId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot migrate an agency without an existing OWNER user';
  END IF;
END $$;

ALTER TABLE "Organization" ALTER COLUMN "ownerId" SET NOT NULL;
CREATE INDEX "Organization_ownerId_idx" ON "Organization"("ownerId");
ALTER TABLE "Organization"
ADD CONSTRAINT "Organization_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
