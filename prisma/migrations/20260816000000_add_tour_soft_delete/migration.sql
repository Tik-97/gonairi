-- AlterTable
ALTER TABLE "Tour" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Tour_organizationId_deletedAt_idx" ON "Tour"("organizationId", "deletedAt");
