-- CreateTable
CREATE TABLE "DepartureVehicle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "departureId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "driverId" TEXT,
    "guideId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepartureVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DepartureVehicle_organizationId_idx" ON "DepartureVehicle"("organizationId");

-- CreateIndex
CREATE INDEX "DepartureVehicle_vehicleId_idx" ON "DepartureVehicle"("vehicleId");

-- CreateIndex
CREATE INDEX "DepartureVehicle_driverId_idx" ON "DepartureVehicle"("driverId");

-- CreateIndex
CREATE INDEX "DepartureVehicle_guideId_idx" ON "DepartureVehicle"("guideId");

-- CreateIndex
CREATE UNIQUE INDEX "DepartureVehicle_departureId_vehicleId_key" ON "DepartureVehicle"("departureId", "vehicleId");

-- AddForeignKey
ALTER TABLE "DepartureVehicle" ADD CONSTRAINT "DepartureVehicle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartureVehicle" ADD CONSTRAINT "DepartureVehicle_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "Departure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartureVehicle" ADD CONSTRAINT "DepartureVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartureVehicle" ADD CONSTRAINT "DepartureVehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartureVehicle" ADD CONSTRAINT "DepartureVehicle_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: one DepartureVehicle row per existing Departure that has a
-- vehicle and/or a driver/guide assigned. Covers both the common case
-- (assignedVehicleId set) and the pre-existing "guide/driver, no vehicle"
-- case (a walking-tour-style departure), confirmed still in live use.
INSERT INTO "DepartureVehicle" ("id", "organizationId", "departureId", "vehicleId", "driverId", "guideId", "createdAt")
SELECT gen_random_uuid()::text, "organizationId", "id", "assignedVehicleId", "assignedDriverId", "assignedGuideId", now()
FROM "Departure"
WHERE "assignedVehicleId" IS NOT NULL
   OR "assignedDriverId" IS NOT NULL
   OR "assignedGuideId" IS NOT NULL;

-- Baseline permission grant for the new role, matching DRIVER/GUIDE's existing grant.
INSERT INTO "RolePermission" ("id", "role", "permission") VALUES
  (gen_random_uuid()::text, 'DRIVER_GUIDE', 'schedule:view-own');
