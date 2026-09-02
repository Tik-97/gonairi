CREATE TYPE "CustomerStatus" AS ENUM (
  'REGISTERED',
  'DOCUMENTS_PENDING',
  'VISA_PENDING',
  'VISA_CONFIRMED',
  'VISA_REJECTED',
  'WAITING_TRAVEL',
  'TRAVELLING',
  'TRAVEL_COMPLETED',
  'CANCELLED'
);

CREATE TYPE "VisaStatus" AS ENUM (
  'NOT_REQUIRED',
  'NOT_STARTED',
  'IN_PROGRESS',
  'APPROVED',
  'REJECTED',
  'EXPIRED'
);

CREATE TYPE "TourPriceCategory" AS ENUM (
  'TICKET',
  'HOTEL',
  'TRANSFER',
  'VISA',
  'INSURANCE',
  'GUIDE',
  'MEALS',
  'ACTIVITIES',
  'OTHER'
);

ALTER TABLE "Customer"
  ADD COLUMN "birthDate" DATE,
  ADD COLUMN "passportNumber" TEXT,
  ADD COLUMN "passportIssuedBy" TEXT,
  ADD COLUMN "passportIssueDate" DATE,
  ADD COLUMN "passportExpiryDate" DATE,
  ADD COLUMN "whatsapp" TEXT,
  ADD COLUMN "telegram" TEXT,
  ADD COLUMN "visaStatus" "VisaStatus" NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN "visaCountry" TEXT,
  ADD COLUMN "visaType" TEXT,
  ADD COLUMN "visaApplicationDate" DATE,
  ADD COLUMN "visaDecisionDate" DATE,
  ADD COLUMN "visaExpiryDate" DATE,
  ADD COLUMN "status" "CustomerStatus" NOT NULL DEFAULT 'REGISTERED';

ALTER TABLE "Tour"
  ADD COLUMN "startDate" DATE,
  ADD COLUMN "endDate" DATE;

CREATE TABLE "CustomerDocument" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "mimeType" TEXT,
  "size" INTEGER,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerStatusHistory" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "changedByUserId" TEXT,
  "fromStatus" "CustomerStatus",
  "toStatus" "CustomerStatus" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TourHotel" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tourId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "checkIn" DATE NOT NULL,
  "checkOut" DATE NOT NULL,
  "address" TEXT,
  "roomType" TEXT,
  "confirmationNumber" TEXT,
  "notes" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TourHotel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TourPriceItem" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tourId" TEXT NOT NULL,
  "category" "TourPriceCategory" NOT NULL,
  "description" TEXT,
  "amount" DECIMAL(10,2) NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TourPriceItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerDocument_customerId_url_key" ON "CustomerDocument"("customerId", "url");
CREATE INDEX "CustomerDocument_organizationId_customerId_idx" ON "CustomerDocument"("organizationId", "customerId");
CREATE INDEX "CustomerStatusHistory_organizationId_customerId_createdAt_idx" ON "CustomerStatusHistory"("organizationId", "customerId", "createdAt");
CREATE INDEX "CustomerStatusHistory_changedByUserId_idx" ON "CustomerStatusHistory"("changedByUserId");
CREATE UNIQUE INDEX "TourHotel_tourId_position_key" ON "TourHotel"("tourId", "position");
CREATE INDEX "TourHotel_organizationId_tourId_idx" ON "TourHotel"("organizationId", "tourId");
CREATE UNIQUE INDEX "TourPriceItem_tourId_position_key" ON "TourPriceItem"("tourId", "position");
CREATE INDEX "TourPriceItem_organizationId_tourId_idx" ON "TourPriceItem"("organizationId", "tourId");

ALTER TABLE "CustomerDocument" ADD CONSTRAINT "CustomerDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerDocument" ADD CONSTRAINT "CustomerDocument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerStatusHistory" ADD CONSTRAINT "CustomerStatusHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerStatusHistory" ADD CONSTRAINT "CustomerStatusHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerStatusHistory" ADD CONSTRAINT "CustomerStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TourHotel" ADD CONSTRAINT "TourHotel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TourHotel" ADD CONSTRAINT "TourHotel_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TourPriceItem" ADD CONSTRAINT "TourPriceItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TourPriceItem" ADD CONSTRAINT "TourPriceItem_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "CustomerStatusHistory" (
  "id", "organizationId", "customerId", "fromStatus", "toStatus", "note", "createdAt"
)
SELECT
  'status_' || "id", "organizationId", "id", NULL, 'REGISTERED', 'Imported existing customer', "createdAt"
FROM "Customer";
