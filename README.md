# GoNairi (ToursOrganizer)

A multi-tenant SaaS back-office for Armenian tour agencies — tours, departures,
customers, bookings, fleet, and staff/HR — built to also power a public
booking marketplace (currently closed via `proxy.ts`, see below).

For the full architecture writeup, findings, and session-by-session change
history, see [`docs/ARCHITECTURE_AUDIT.md`](docs/ARCHITECTURE_AUDIT.md) and
[`docs/REFACTOR_PROGRESS.md`](docs/REFACTOR_PROGRESS.md). This file is a
practical getting-started guide; those two are the deeper reference.

## Stack

- Next.js (App Router, Turbopack, Server Actions) — **read
  `node_modules/next/dist/docs/` before writing code that touches routing,
  caching, or Server Actions.** This is a customized build with breaking
  changes from stock Next.js; see `AGENTS.md`.
- React 19, TypeScript (strict)
- Prisma 7 (`@prisma/adapter-pg`) against Neon serverless Postgres
- NextAuth v5 (Auth.js) — one shared credentials login for agency users and
  the platform Super Admin, with active-role selection for multi-role users
- Tailwind v4, hand-rolled components (a handful of shadcn/ui primitives are
  used where they earn their keep — e.g. `components/ui/dropdown-menu.tsx`)
- Vercel Blob for tour photo uploads, with a local-filesystem fallback in dev
- Vitest for tests (pure-logic unit tests + real-DB integration tests)

## Where things live

| You're looking for... | It's in... |
|---|---|
| A page/route | `app/` — one folder per route segment, route groups `(auth)`/`(public)` for shared layout without a URL segment |
| Business logic / mutations | `lib/actions/<domain>.ts` — one file per domain, all Server Actions (`"use server"`), auth guard first, then Zod validation, then the mutation |
| Shared business logic used by more than one action | `lib/<domain>/` — e.g. `lib/bookings/create-booking.ts` (the atomic overbooking-safe transaction), `lib/bookings/pricing.ts` |
| Auth / permission checks | `lib/auth/` — `session.ts` (`requireSession`/`requirePermission`), `permissions.ts` (DB-backed role→permission resolution), `permission-keys.ts` (client-safe constants) |
| Database access | `lib/db.ts` (raw client — public marketplace reads + platform-admin tooling only) and `lib/db/scoped.ts` (`scopedPrisma(organizationId)` — the **only** sanctioned way to touch tenant data; auto-injects `organizationId` into every query) |
| Validation | Zod schemas live at the top of the relevant `lib/actions/<domain>.ts` file, next to the action(s) that use them. Shared fragments (e.g. `optionalPhoneField`) live in small `lib/*.ts` utility files |
| Shared UI components | `components/` — domain forms/pickers/combobox at the top level, `components/dashboard/` for dashboard chrome (sidebar, topbar, charts), `components/ornaments/` for decorative SVGs |
| Types | Colocated with what they describe — component prop types inline, domain types in the relevant `lib/` file. `types/next-auth.d.ts` is the one global module-augmentation file (session shapes) |
| Tests | Colocated `*.test.ts` next to pure-logic code in `lib/`; DB-touching integration tests in `tests/integration/` |
| Database schema | `prisma/schema.prisma` — every model has a `///` comment explaining its purpose |

## Getting started

1. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` / `DIRECT_URL` — a Neon (or other) Postgres instance. The
     pooled URL is used at runtime; the direct URL is used only for migrations.
   - `AUTH_SECRET` — generate with
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `BLOB_READ_WRITE_TOKEN` — optional locally (tour photo uploads fall back
     to `/public/uploads` if unset); required in production.
   - `MARKETPLACE_ENABLED` — optional, defaults to closed. See `proxy.ts`.
2. `npm install` (this also runs `prisma generate` via `postinstall`).
3. Apply migrations: `npx prisma migrate deploy`.
4. Run `npx prisma db seed`. This imports the geography and tour-hashtag
   catalogues, then creates the first Platform Admin from `SEED_ADMIN_EMAIL`,
   `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_NAME`. Development defaults are
   documented in `.env.example`; production requires secure overrides.
   Rerunning the seed never resets an existing administrator's password.
5. Sign in at `/login` and create each travel agency and its Owner from
   `/admin/agencies`. Public agency registration is intentionally disabled.

### Applying a schema change

`prisma migrate dev` cannot run non-interactively in this environment. After
editing `prisma/schema.prisma`, generate and apply migrations by hand:

```bash
mkdir -p prisma/migrations/<timestamp>_<name>
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script \
  > prisma/migrations/<timestamp>_<name>/migration.sql
npx prisma migrate deploy
npx prisma generate
```

## Scripts

- `npm run dev` / `npm run build` / `npm start`
- `npm run build` always regenerates Prisma Client before compiling, including
  when a deployment platform restores a cached dependency installation
- `npm run lint` — ESLint
- `npm test` / `npm run test:watch` — Vitest (unit + DB integration tests,
  runs against the real dev database — there is no separate test DB)
- `npx prisma db seed` / `npm run db:seed` — idempotently import geography and
  the tour-hashtag catalogue, then create the first Platform Admin when none exists
- `npm run db:migrate:deploy` — apply pending migrations in staging/production
- `npm run seed:categories` — idempotently seed only the 67 tour hashtags
- `node scripts/create-platform-admin.cjs` — bootstrap the first Super Admin
  account (signs in through `/login`)
- `npm run seed:demo` — create a repeatable, full-feature demo dataset. It
  resets only deterministic demo records (`@demo.gonairi.test`) and preserves
  existing application data and never reads or changes `PlatformAdmin`. The
  command prints the generated agency-user credentials when it finishes; set
  `DEMO_SEED_PASSWORD` to override only those demo users' shared password.

## Production deployment

Merges to `master` can deploy automatically to the PM2 server through GitHub
Actions. The workflow builds the application, applies migrations, runs the
idempotent default seed, and restarts only the `gonairi` process. Complete the
one-time SSH and GitHub environment setup in
[`docs/PRODUCTION_DEPLOYMENT.md`](docs/PRODUCTION_DEPLOYMENT.md).

## Multi-tenancy & authorization, in one paragraph

Every tenant-owned table has an `organizationId` column. `scopedPrisma()` is
a Prisma Client Extension that auto-injects `organizationId` into every
query for a fixed allowlist of models (`TENANT_SCOPED_MODELS` in
`lib/db/scoped.ts`, enforced against schema drift by `lib/db/scoped.test.ts`).
Authorization is a fixed set of `Permission` keys resolved per-role from a
`RolePermission` DB table (editable live at `/admin/roles`) rather than
hardcoded role arrays — see `lib/auth/permissions.ts`.
