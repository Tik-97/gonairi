-- Defense-in-depth: even if application logic has a bug, the DB refuses to let
-- a Departure's bookedCount exceed its capacity.
ALTER TABLE "Departure" ADD CONSTRAINT "Departure_bookedCount_capacity_check" CHECK ("bookedCount" <= "capacity");
