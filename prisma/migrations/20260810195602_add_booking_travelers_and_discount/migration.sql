-- CreateEnum
CREATE TYPE "TravelerPriceType" AS ENUM ('FULL', 'HALF', 'FREE');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "discountPercent" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BookingTraveler" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "isChild" BOOLEAN NOT NULL DEFAULT false,
    "priceType" "TravelerPriceType" NOT NULL DEFAULT 'FULL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingTraveler_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingTraveler_organizationId_idx" ON "BookingTraveler"("organizationId");

-- CreateIndex
CREATE INDEX "BookingTraveler_bookingId_idx" ON "BookingTraveler"("bookingId");

-- AddForeignKey
ALTER TABLE "BookingTraveler" ADD CONSTRAINT "BookingTraveler_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTraveler" ADD CONSTRAINT "BookingTraveler_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
