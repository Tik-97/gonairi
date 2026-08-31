-- Add a first-class private tour type and its intended CRM customers.
ALTER TABLE "Tour" ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "TourCustomer" (
    "organizationId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourCustomer_pkey" PRIMARY KEY ("tourId", "customerId")
);

CREATE INDEX "TourCustomer_organizationId_customerId_idx"
ON "TourCustomer"("organizationId", "customerId");

ALTER TABLE "TourCustomer"
ADD CONSTRAINT "TourCustomer_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TourCustomer"
ADD CONSTRAINT "TourCustomer_tourId_fkey"
FOREIGN KEY ("tourId") REFERENCES "Tour"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TourCustomer"
ADD CONSTRAINT "TourCustomer_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
