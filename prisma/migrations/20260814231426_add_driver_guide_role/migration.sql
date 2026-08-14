-- Split into its own migration on purpose: Postgres won't let a new enum
-- value be used (e.g. in an INSERT) in the same transaction that adds it, so
-- this must commit before the next migration's RolePermission seed insert
-- can reference 'DRIVER_GUIDE'.
ALTER TYPE "UserRole" ADD VALUE 'DRIVER_GUIDE';
