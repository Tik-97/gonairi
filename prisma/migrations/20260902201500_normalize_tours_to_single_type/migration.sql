-- Individual travel is represented by Booking records attached to a Departure.
-- Keep the legacy column for a backwards-compatible rollout, but normalize all
-- existing tours and ensure every current write path keeps it false.
UPDATE "Tour"
SET "isPrivate" = false
WHERE "isPrivate" = true;
