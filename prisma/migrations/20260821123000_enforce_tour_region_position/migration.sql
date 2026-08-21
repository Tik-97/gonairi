-- A tour's destination order must be deterministic: one position per link.
CREATE UNIQUE INDEX "TourRegion_tourId_position_key" ON "TourRegion"("tourId", "position");
