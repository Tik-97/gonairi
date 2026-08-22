# Date and timezone policy

All values that represent an instant are stored in PostgreSQL as
`TIMESTAMPTZ(3)` and cross the server boundary as ISO-8601 UTC strings ending
in `Z`. PostgreSQL normalizes `timestamptz` values to UTC internally.

The browser supplies its IANA timezone (for example `Asia/Yerevan`) from
`Intl.DateTimeFormat().resolvedOptions().timeZone`. This does not require or
request GPS/location permission. Local wall-clock input is converted with the
offset that applies on the selected date, including daylight-saving changes,
and invalid times inside a DST clock jump are rejected.

UI timestamps must be rendered with `LocalDateTime`; server components pass it
`date.toISOString()`. Date/time forms must submit a UTC instant and a validated
`timeZone` field. Shared conversion and validation live in `lib/time-zone.ts`.

Calendar-only values are not instants. `Attendance.date` intentionally remains
a PostgreSQL `DATE` and must keep its `YYYY-MM-DD` meaning without timezone
conversion.

The migration `20260821160000_store_instants_as_timestamptz` interprets legacy
`timestamp` values as UTC to preserve the instants Prisma previously returned.
Review that assumption against production data before running
`npm run db:migrate:deploy`; if legacy rows were actually entered as another
zone's wall time, they need a one-off data correction before deployment.
