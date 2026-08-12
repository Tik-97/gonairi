-- Grant the new finances:view and finances:manage permissions to OWNER and
-- ADMIN, matching how every other domain's baseline permissions were seeded.
-- Backs the new Finances section (payment ledger + recording), which uses
-- the pre-existing Payment model that had no UI until now.
INSERT INTO "RolePermission" ("id", "role", "permission") VALUES
  (gen_random_uuid()::text, 'OWNER', 'finances:view'),
  (gen_random_uuid()::text, 'OWNER', 'finances:manage'),
  (gen_random_uuid()::text, 'ADMIN', 'finances:view'),
  (gen_random_uuid()::text, 'ADMIN', 'finances:manage');
