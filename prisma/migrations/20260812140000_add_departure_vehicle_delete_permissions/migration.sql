-- Grant the new departures:delete and vehicles:delete permissions to OWNER
-- and ADMIN, matching how tours:delete and customers:delete were seeded —
-- until now, hard-deleting a Departure or Vehicle wasn't possible for any
-- role, only deactivating (cancel / isActive toggle).
INSERT INTO "RolePermission" ("id", "role", "permission") VALUES
  (gen_random_uuid()::text, 'OWNER', 'departures:delete'),
  (gen_random_uuid()::text, 'OWNER', 'vehicles:delete'),
  (gen_random_uuid()::text, 'ADMIN', 'departures:delete'),
  (gen_random_uuid()::text, 'ADMIN', 'vehicles:delete');
