-- DropForeignKey
ALTER TABLE "Departure" DROP CONSTRAINT "Departure_assignedDriverId_fkey";

-- DropForeignKey
ALTER TABLE "Departure" DROP CONSTRAINT "Departure_assignedGuideId_fkey";

-- DropForeignKey
ALTER TABLE "Departure" DROP CONSTRAINT "Departure_assignedVehicleId_fkey";

-- AlterTable
ALTER TABLE "Departure" DROP COLUMN "assignedDriverId",
DROP COLUMN "assignedGuideId",
DROP COLUMN "assignedVehicleId";

-- AlterTable
ALTER TABLE "Tour" DROP COLUMN "maxPax",
DROP COLUMN "minPax";

