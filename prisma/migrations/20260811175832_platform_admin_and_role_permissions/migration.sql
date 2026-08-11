-- CreateTable
CREATE TABLE "PlatformAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdmin_email_key" ON "PlatformAdmin"("email");

-- CreateIndex
CREATE INDEX "RolePermission_role_idx" ON "RolePermission"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_permission_key" ON "RolePermission"("role", "permission");

-- Seed the initial role -> permission grants, matching the matrix that was
-- previously hardcoded in lib/auth/permissions.ts. Without this seed, the
-- moment this migration lands every role would have zero permissions.
INSERT INTO "RolePermission" ("id", "role", "permission") VALUES
  (gen_random_uuid()::text, 'OWNER', 'tours:view'),
  (gen_random_uuid()::text, 'OWNER', 'tours:manage'),
  (gen_random_uuid()::text, 'OWNER', 'tours:delete'),
  (gen_random_uuid()::text, 'OWNER', 'departures:manage'),
  (gen_random_uuid()::text, 'OWNER', 'bookings:view'),
  (gen_random_uuid()::text, 'OWNER', 'bookings:manage'),
  (gen_random_uuid()::text, 'OWNER', 'customers:view'),
  (gen_random_uuid()::text, 'OWNER', 'customers:manage'),
  (gen_random_uuid()::text, 'OWNER', 'customers:delete'),
  (gen_random_uuid()::text, 'OWNER', 'vehicles:view'),
  (gen_random_uuid()::text, 'OWNER', 'vehicles:manage'),
  (gen_random_uuid()::text, 'OWNER', 'staff:view'),
  (gen_random_uuid()::text, 'OWNER', 'staff:manage'),
  (gen_random_uuid()::text, 'OWNER', 'attendance:manage'),
  (gen_random_uuid()::text, 'OWNER', 'schedule:view-own'),
  (gen_random_uuid()::text, 'OWNER', 'org:settings-manage'),

  (gen_random_uuid()::text, 'ADMIN', 'tours:view'),
  (gen_random_uuid()::text, 'ADMIN', 'tours:manage'),
  (gen_random_uuid()::text, 'ADMIN', 'tours:delete'),
  (gen_random_uuid()::text, 'ADMIN', 'departures:manage'),
  (gen_random_uuid()::text, 'ADMIN', 'bookings:view'),
  (gen_random_uuid()::text, 'ADMIN', 'bookings:manage'),
  (gen_random_uuid()::text, 'ADMIN', 'customers:view'),
  (gen_random_uuid()::text, 'ADMIN', 'customers:manage'),
  (gen_random_uuid()::text, 'ADMIN', 'customers:delete'),
  (gen_random_uuid()::text, 'ADMIN', 'vehicles:view'),
  (gen_random_uuid()::text, 'ADMIN', 'vehicles:manage'),
  (gen_random_uuid()::text, 'ADMIN', 'staff:view'),
  (gen_random_uuid()::text, 'ADMIN', 'staff:manage'),
  (gen_random_uuid()::text, 'ADMIN', 'attendance:manage'),
  (gen_random_uuid()::text, 'ADMIN', 'schedule:view-own'),
  (gen_random_uuid()::text, 'ADMIN', 'org:settings-manage'),

  (gen_random_uuid()::text, 'OPERATOR', 'tours:view'),
  (gen_random_uuid()::text, 'OPERATOR', 'tours:manage'),
  (gen_random_uuid()::text, 'OPERATOR', 'departures:manage'),
  (gen_random_uuid()::text, 'OPERATOR', 'bookings:view'),
  (gen_random_uuid()::text, 'OPERATOR', 'bookings:manage'),
  (gen_random_uuid()::text, 'OPERATOR', 'customers:view'),
  (gen_random_uuid()::text, 'OPERATOR', 'customers:manage'),
  (gen_random_uuid()::text, 'OPERATOR', 'vehicles:view'),
  (gen_random_uuid()::text, 'OPERATOR', 'vehicles:manage'),
  (gen_random_uuid()::text, 'OPERATOR', 'staff:view'),
  (gen_random_uuid()::text, 'OPERATOR', 'schedule:view-own'),

  (gen_random_uuid()::text, 'DRIVER', 'schedule:view-own'),
  (gen_random_uuid()::text, 'GUIDE', 'schedule:view-own');
