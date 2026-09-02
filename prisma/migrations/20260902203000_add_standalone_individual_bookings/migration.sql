ALTER TABLE "Booking"
  ALTER COLUMN "departureId" DROP NOT NULL,
  ADD COLUMN "individualTitle" TEXT,
  ADD COLUMN "travelStartDate" DATE,
  ADD COLUMN "travelEndDate" DATE,
  ADD COLUMN "hotels" JSONB,
  ADD COLUMN "priceBreakdown" JSONB;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_individual_or_departure_check"
  CHECK (
    "departureId" IS NOT NULL
    OR (
      "individualTitle" IS NOT NULL
      AND "travelStartDate" IS NOT NULL
      AND "travelEndDate" IS NOT NULL
    )
  );
