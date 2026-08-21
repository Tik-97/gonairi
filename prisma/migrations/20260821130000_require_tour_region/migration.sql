-- The application requires every tour to have at least one destination.
-- A deferred constraint supports nested writes/seed transactions while also
-- protecting the invariant from raw SQL and future non-application writers.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "Tour" AS tour
        WHERE NOT EXISTS (
            SELECT 1 FROM "TourRegion" AS link WHERE link."tourId" = tour."id"
        )
    ) THEN
        RAISE EXCEPTION 'Cannot require tour regions: one or more existing tours have no TourRegion row';
    END IF;
END $$;

CREATE FUNCTION "checkTourHasRegion"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    checked_tour_id TEXT;
BEGIN
    IF TG_TABLE_NAME = 'Tour' THEN
        checked_tour_id := NEW."id";
    ELSE
        checked_tour_id := OLD."tourId";
    END IF;

    IF EXISTS (SELECT 1 FROM "Tour" WHERE "id" = checked_tour_id)
       AND NOT EXISTS (SELECT 1 FROM "TourRegion" WHERE "tourId" = checked_tour_id) THEN
        RAISE EXCEPTION 'Tour % must have at least one region', checked_tour_id
            USING ERRCODE = '23514', CONSTRAINT = 'Tour_requires_region';
    END IF;

    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "Tour_requires_region_after_insert"
AFTER INSERT ON "Tour"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "checkTourHasRegion"();

CREATE CONSTRAINT TRIGGER "Tour_requires_region_after_link_removal"
AFTER DELETE OR UPDATE ON "TourRegion"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "checkTourHasRegion"();
