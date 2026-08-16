-- Preserve every user's current role while moving to a PostgreSQL enum array.
ALTER TABLE "User"
ADD COLUMN "roles" "UserRole"[] NOT NULL DEFAULT ARRAY['OPERATOR']::"UserRole"[];

UPDATE "User"
SET "roles" = ARRAY["role"]::"UserRole"[];

ALTER TABLE "User" DROP COLUMN "role";

-- Role eligibility queries (for example driver/guide assignment pickers) use
-- array containment and are accelerated by this GIN index.
CREATE INDEX "User_roles_idx" ON "User" USING GIN ("roles");
