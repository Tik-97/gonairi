# GoNairi (ToursOrganizer) — Architecture Audit

**Audit date:** 2026-08-11
**Scope:** Full repository — no production code was modified during this audit.
**Auditor process:** Manual inspection of every top-level directory, all `lib/`, `app/`, `components/` files, `prisma/schema.prisma` + all 5 migrations, `auth.ts`, `proxy.ts` (middleware), config files, dependency graph, and cross-reference checks for dead code, tenant-isolation violations, and duplication.

---

## 1. Current Architecture

GoNairi is a **multi-tenant SaaS for Armenian tour agencies**: a back-office (tours, schedules, customers, bookings, fleet, staff/HR) that is designed to double as a public booking marketplace. The marketplace side exists in code but is currently **closed** via a middleware redirect (see §4).

**Stack:**
- Next.js 16.2.12 (App Router, Turbopack, Server Actions) — *note: this is a customized/non-standard build per the project's own `AGENTS.md`, with caching behavior that differs from stock Next.js (see Problem P1-6).*
- React 19.2, TypeScript (strict, zero `any` usage found anywhere in the codebase)
- Prisma 7 (`@prisma/adapter-pg`, direct Postgres driver, not the classic Prisma Data Proxy)
- Neon serverless Postgres (pooled endpoint for app runtime, direct endpoint for migrations)
- NextAuth v5 (Auth.js), JWT session strategy, **two** Credentials providers (tenant staff + platform Super Admin)
- Tailwind v4, a scaffolded-but-mostly-unused shadcn/ui layer, hand-rolled components for everything else
- Vercel Blob for tour image uploads (with a local-filesystem fallback for dev)
- **No test framework installed.** No CI config. **No git repository** (confirmed: `git status` → "not a git repository").

**Application surfaces (all in one Next.js app, split by route group/segment):**

| Surface | Routes | Auth principal | Status |
|---|---|---|---|
| Tenant back-office | `/dashboard/*` | `User` (OWNER/ADMIN/OPERATOR/DRIVER/GUIDE), tenant-scoped | Live, primary product |
| Platform Super Admin | `/admin/*` | `PlatformAdmin`, not tenant-scoped | Live, built this session |
| Public marketplace | `/`, `/tours*`, `/agencies*`, `/book/*`, `/bookings/*` | none (guest) | **Built but closed** — middleware redirects all of it to `/login` |
| Auth | `/login`, `/register` | tenant `User` | Live |

**Authorization model** (the subject of the most recent work): a fixed set of 16 `Permission` string keys (`lib/auth/permission-keys.ts`, safe for client import) are checked everywhere via `requirePermission()`/`roleHasPermission()`. Which of the 5 roles hold which permissions is **data**, not code — stored in a `RolePermission` table, editable live from `/admin/roles`. This replaced an earlier generation of ~9 hardcoded `["OWNER","ADMIN","OPERATOR"]` role arrays scattered across action files.

**Multi-tenancy model:** row-level tenancy. Every tenant-owned table has an `organizationId` column. A single Prisma Client Extension, `scopedPrisma(organizationId)` (`lib/db/scoped.ts`), is the **only sanctioned way** to touch tenant data from back-office code — it auto-injects `organizationId` into every `where`/`data` clause for a hardcoded allowlist of model names (`TENANT_SCOPED_MODELS`). The raw, unscoped `prisma` client (`lib/db.ts`) is reserved for: public marketplace reads (always filtered to `isPublished: true` explicitly in the query), and the handful of genuinely-global operations (org creation, cross-org email-uniqueness checks, platform-admin/role-permission tables).

---

## 2. Current Project Structure

```
app/
  (auth)/login, (auth)/register        — tenant login/register, shared card layout
  (public)/                            — marketplace: home, tours, tour detail, agency profile,
                                          guest booking, booking-status lookup — CLOSED via proxy.ts
  admin/
    login/                             — Super Admin login (public route)
    (protected)/roles/                 — the RolePermission matrix editor
  api/auth/[...nextauth]/              — NextAuth route handler (only API route in the app)
  dashboard/
    (overview, tours, bookings, customers, vehicles, staff, schedule, settings/organization)
    — one folder per domain, [id]/edit and [id]/new as nested routes, no route handlers

lib/
  actions/          — one file per domain, all "use server", Zod-validated Server Actions
                       (tours, departures, bookings, customers, vehicles, staff, attendance,
                        organization, upload, guest-bookings, auth, platform-admin)
  auth/              — session.ts (requireSession/requirePermission), permissions.ts (DB-backed,
                        server-only, React.cache()-memoized), permission-keys.ts (client-safe
                        constants), platform-admin-session.ts
  bookings/          — createBooking.ts (shared atomic capacity transaction), pricing.ts (shared
                        calculateBookingTotal)
  dashboard/stats.ts — dashboard overview aggregation queries
  db.ts              — raw Prisma client singleton
  db/scoped.ts       — the tenant-isolation Prisma Client Extension
  format.ts, phone.ts, slug.ts, utils.ts — small pure helpers

components/
  *.tsx              — ~20 hand-rolled domain components (forms, pickers, combobox)
  dashboard/          — sidebar/topbar/mobile-nav/charts/page-header (dashboard chrome)
  ornaments/          — decorative SVGs (Armenian motif)
  ui/                 — shadcn/ui primitives — mostly unused, see Problem P3-13

prisma/
  schema.prisma       — 13 models, 9 enums
  migrations/          — 5 migrations, hand-authored via a manual workaround (see §9 Risks) since
                         `prisma migrate dev` cannot run non-interactively in this environment

scripts/create-platform-admin.cjs — the only operational script in the repo
types/next-auth.d.ts — module augmentation for the two session shapes (tenant / platform-admin)
auth.ts, proxy.ts     — NextAuth config, edge middleware (renamed `proxy.ts` per this Next build)
```

No `tests/`, `__tests__/`, `*.test.ts`, or `*.spec.ts` files exist anywhere in the repository.

---

## 3. Main Data Flows

**A. Tenant back-office read (e.g. `/dashboard/customers`)**
```
Request → proxy.ts (edge, optimistic cookie check only)
        → Server Component page
        → requirePermission(PERMISSIONS.customersView)   [real check: auth() → JWT decode
                                                            → roleHasPermission() → DB query
                                                            against RolePermission, cached once
                                                            per request via React cache()]
        → scopedPrisma(session.user.organizationId).customer.findMany(...)
        → render
```

**B. Tenant mutation (e.g. create tour)**
```
Client form → useActionState → Server Action (lib/actions/tours.ts)
            → requirePermission(PERMISSIONS.toursManage)
            → Zod safeParse
            → scopedPrisma(...).tour.create(...)
            → redirect()
```

**C. Booking creation (shared by staff-manual AND guest-public flows)**
```
lib/actions/bookings.ts (staff) ──┐
                                    ├──→ lib/bookings/createBooking.ts
lib/actions/guest-bookings.ts ────┘        → scopedPrisma(...).$transaction(async tx => {
                                                 raw SQL conditional UPDATE:
                                                 bookedCount = bookedCount + pax
                                                 WHERE bookedCount + pax <= capacity
                                                 (0 rows updated ⇒ NotEnoughAvailabilityError)
                                                 → tx.booking.create(...)
                                                 → tx.bookingTraveler.createMany(...)
                                             })
```
This is the single most safety-critical piece of business logic in the app (prevents overbooking under concurrent requests) and it is implemented **once**, correctly, and shared by both entry points.

**D. Super Admin permission edit**
```
/admin/roles form → updateRolePermissions(role, formData)
                  → requirePlatformAdmin()
                  → prisma.$transaction([deleteMany, createMany])  [RolePermission is global,
                                                                     not tenant-scoped — raw client]
                  → revalidatePath("/dashboard", "layout") + revalidatePath("/admin/roles")
                  → redirect("/admin/roles")
```
Every tenant page that calls `roleHasPermission()`/`requirePermission()` re-queries the DB fresh (memoized only within a single request), so this change is live platform-wide immediately at the *authorization* layer. There is a separate, narrower caching quirk affecting how quickly *already-rendered UI affordances* (e.g. a "+ New customer" button) catch up — see Problem P1-6.

**E. Public marketplace read (currently unreachable — middleware blocks it)**
```
Guest → raw `prisma` (unscoped, no session) → explicit `isPublished: true` filters at both the
       Organization AND Tour level → render
```

---

## 4. Main Business Logic Flows

- **Tenant isolation** — enforced at exactly one choke point, `scopedPrisma()`. Verified: every `lib/actions/*.ts` file either uses `scopedPrisma` or, where it legitimately uses the raw `prisma` client, does so with an explicit, session-derived filter (organization creation, global email-uniqueness checks, the Organization record's own self-update, and the genuinely-global `RolePermission`/`PlatformAdmin` tables). No violations found.
- **RBAC** — 16 `Permission` keys × 5 roles, resolved from the `RolePermission` table. `OWNER_PERMISSION_FLOOR` (`org:settings-manage`, `staff:manage`) is hardcoded as non-revocable for OWNER so a Super Admin mistake can never lock an entire agency out of its own settings.
- **Overbooking prevention** — see §3-C. Single atomic conditional UPDATE, shared.
- **Pricing** — `calculateBookingTotal()` (`lib/bookings/pricing.ts`) is a pure function, reused for both the client-side live estimate (UX preview) and the server's authoritative calculation in the **staff/manual** booking flow. This is a good pattern (no duplicated logic, client can never be trusted anyway since server recomputes). The **guest** booking flow does **not** use this shared function — see Problem P2-9.
- **Resource conflict detection** — `findResourceConflict()` in `lib/actions/departures.ts` checks same-day overlaps for vehicle/driver/guide before allowing an assignment; shared by create/update paths within that file.
- **Marketplace visibility** — enforced redundantly at two levels: `proxy.ts`'s hardcoded closed-route list, AND `Organization.isPublished`/`Tour.isPublished` flags checked in every marketplace query. Either alone would suffice once the marketplace reopens; see Problem P2-10.

---

## 5. Problems Discovered

Findings are listed with file references. Priorities are defined in §6.

1. **(P0)** ~~No git repository anywhere in the project.~~ **Resolved** — see `docs/REFACTOR_PROGRESS.md`.
2. **(P0)** ~~No automated tests of any kind; no test framework installed.~~ **Resolved** — Vitest, 31 tests across 6 files (pure-logic unit tests + real-DB integration tests for tenant isolation, RBAC, and the overbooking race). See `docs/REFACTOR_PROGRESS.md`.
3. **(P1)** ~~Path-traversal-shaped input handling in `deleteTourImage`~~ **Resolved** — see `docs/REFACTOR_PROGRESS.md`. *(Original finding, kept for record: `lib/actions/upload.ts:64-75` — a caller-supplied `url` string was only checked with `startsWith(LOCAL_UPLOAD_PREFIX)` before being passed through `path.join(process.cwd(), "public", url)` and `unlink`ed.)*
4. **(P1)** ~~No rate limiting / brute-force protection on `/login`, `/register`, or `/admin/login`~~ **Resolved** — see `docs/REFACTOR_PROGRESS.md`. *(Original finding, kept for record: `lib/actions/auth.ts`, `lib/actions/platform-admin.ts` had zero throttling on any of the 3 unauthenticated entry points. The account-existence leak on `registerOrganization`'s "already registered" error message was deliberately left as-is — rate limiting the registration endpoint already mitigates bulk enumeration, and the message itself is a common, low-severity pattern; changing it was judged unnecessary security complexity for the residual risk. See `docs/REFACTOR_PROGRESS.md` for the full reasoning.)*
5. **(P1)** ~~No structured error logging/observability.~~ **Resolved (minimal convention)** — see `docs/REFACTOR_PROGRESS.md`. *(Original finding, kept for record: Server Action failures either returned `{error}` to the UI or threw and hit Next's default error boundary, with no server-side logging convention anywhere in the codebase. Fixed with a deliberately minimal `lib/log.ts` — a consistent `console.error` shape, not a full observability platform — applied where errors were previously silently swallowed.)*
6. **(P1)** A caching characteristic specific to this customized Next.js build: pages that derive their render from `next-auth`'s `auth()` (which reads cookies internally, not via `cookies()` directly in the page body) are **not** automatically treated as dynamic.
   **Update (second session):** the centralized fix this document originally recommended (`connection()` inside `requireSession()`/`requirePlatformAdmin()`, replacing the scattered `force-dynamic` exports) was implemented — and **did not fully resolve it.** The exact same ~1-2 second staleness window reproduces with `connection()` centralized, exactly as it did with `force-dynamic` + `revalidatePath`. New evidence gathered: the bug reproduces identically in a production build (`next build && next start`), ruling out any Turbopack-dev-only explanation; `React.cache()` was directly probed and confirmed to *not* memoize outside a render context, ruling that out too. The actual authorization boundary (`requirePermission` denying/redirecting) has been proven instant and correct in **every** test run across both sessions — only a cosmetic UI affordance on an already-200-rendering page can lag, and only for ~1-2 seconds, self-healing. **This finding should be considered open and only empirically bounded, not resolved** — see `docs/REFACTOR_PROGRESS.md` "Important Discoveries" for the full account of what's been ruled out and the one untried investigative angle (Client Router Cache / connection-reuse tracing), and do not re-attempt "centralize the dynamic-rendering opt-in" as a fix again without new information.
7. **(P2)** Duplicated component logic: `components/category-picker.tsx` and `components/vehicle-type-picker.tsx` are ~95% identical (same single-select-plus-custom-"Other" pattern, same JS-tracked-hover workaround for a Chromium rendering quirk, same class strings). `components/region-picker.tsx` shares the same pill-button-plus-hover-workaround pattern in a multi-select variant. No shared primitive exists. **Not yet fixed.**
8. **(P2)** Schema/UI drift — columns defined in `prisma/schema.prisma` with **zero** reads or writes anywhere in application code: `Tour.itinerary`, `Tour.included`, `Tour.excluded`, `Organization.logoUrl`, `Organization.address`. `Tour.languagesOffered` is written once as a hardcoded `[]` (`lib/actions/tours.ts:94`) and never set by any form field or read anywhere. **Not yet fixed — needs a user decision, see §9.**
9. **(P2)** ~~`createGuestBooking` computes `totalPrice = unitPrice * paxCount` directly instead of calling the shared `calculateBookingTotal()`~~ **Resolved** — see `docs/REFACTOR_PROGRESS.md`.
10. **(P2)** The "closed marketplace" toggle is a hardcoded path-prefix list inside `proxy.ts` (lines 24-29) rather than a single named/documented flag (e.g. an env var). Functionally redundant with the `isPublished` checks already present in every marketplace query. **Not yet fixed.**
11. **(P2)** `README.md` is still the unmodified `create-next-app` boilerplate — no description of the actual product, architecture, or (critically) the non-interactive-migration workaround that is mandatory in this environment.
12. **(P2)** The codebase contains **two parallel UI systems** simultaneously: a scaffolded shadcn/ui component layer (`components/ui/*`, wired up via `components.json`) that is almost entirely unused, and a hand-rolled Tailwind-class-per-element approach used for essentially everything actually rendered. This is an inconsistent-pattern finding in its own right, independent of the dead-code angle in P3-13.
13. **(P3)** Dead code: 9 of 10 shadcn/ui primitives are imported nowhere (`avatar`, `badge`, `button`, `card`, `input`, `label`, `select`, `separator`, `textarea` — only `dropdown-menu.tsx` is actually used, by `components/dashboard/topbar.tsx`). `components/ornaments/flying-bird.tsx` is also imported nowhere.
14. **(P3)** `shadcn` (the CLI codegen tool) is listed under `dependencies` in `package.json` instead of `devDependencies` — it is never imported at runtime.
15. **(P3)** ~~`.gitignore`'s `.env*` pattern has no `!.env.example` negation~~ **Resolved** — fixed before the first commit, see `docs/REFACTOR_PROGRESS.md`.
16. **(P3)** Minor business-logic-in-page instances, e.g. `app/dashboard/tours/page.tsx` inline-sorts tours by soonest-upcoming-departure — small enough not to matter today, but inconsistent with how `lib/dashboard/stats.ts` and `lib/bookings/*` correctly extract this kind of logic. **Not yet fixed.**
17. **(P3)** ~~No lint-time or test-time guard that a newly added tenant-scoped Prisma model actually gets added to `TENANT_SCOPED_MODELS`~~ **Resolved** — `lib/db/scoped.test.ts` now parses `prisma/schema.prisma` and fails `npm test` if the two ever disagree. See `docs/REFACTOR_PROGRESS.md`.

### Explicit positive findings (for calibration — not everything is a problem)

- **Zero** uses of TypeScript `any` anywhere in the codebase.
- **Zero** circular/inverted imports (`lib/` never imports from `app/`).
- **No God components or God services** — largest component (`tour-form.tsx`) is 249 lines, largest page (`dashboard/page.tsx`) is 187 lines, largest `lib/` file (`permissions.ts`) is 115 lines. Everything is proportionate to what it does.
- Tenant isolation is centralized, consistently used, and every exception was individually verified safe.
- The overbooking-race-prevention logic (the single highest-stakes piece of business logic in the app) is implemented once, correctly, atomically, and shared by both booking entry points.
- No `dangerouslySetInnerHTML` anywhere — no obvious stored-XSS vector in rendering.
- The RBAC system built this session is a clean instance of exactly the kind of architecture this audit would otherwise recommend moving *toward* — it's already there.

---

## 6. Priority Classification

*Status column added after two follow-up sessions — see `docs/REFACTOR_PROGRESS.md` for the live, authoritative status and what each fix actually involved.*

| ID | Priority | Summary | Status |
|---|---|---|---|
| 1 | **P0** | No git / version control | ✅ Resolved |
| 2 | **P0** | No automated tests, no CI | ✅ Resolved |
| 3 | **P1** | Path traversal in `deleteTourImage` | ✅ Resolved |
| 4 | **P1** | No rate limiting on auth routes; account-existence leak on registration | ✅ Resolved (rate limiting) — leak accepted as low-severity residual risk |
| 5 | **P1** | No error logging/observability convention | ✅ Resolved (minimal convention) |
| 6 | **P1** | Systemic, only-partially-fixed dynamic-rendering/caching gotcha in this Next.js build | ⚠️ Still open — a second, different fix attempt also failed to fully resolve it; see finding #6 above |
| 7 | **P2** | Duplicated pill-picker components | Not fixed |
| 8 | **P2** | Schema/UI drift (dead columns, unused `languagesOffered`) | Not fixed — needs user decision |
| 9 | **P2** | Guest booking pricing bypasses shared `calculateBookingTotal` | ✅ Resolved |
| 10 | **P2** | Marketplace-closed toggle is a hardcoded list, not a documented flag | Not fixed |
| 11 | **P2** | `README.md` never updated for this project | Not fixed |
| 12 | **P2** | Two parallel, inconsistent UI systems (shadcn scaffold vs. hand-rolled) | Not fixed — needs user decision |
| 13 | **P3** | 10 dead component files | Not fixed |
| 14 | **P3** | `shadcn` misclassified as a runtime dependency | Not fixed |
| 15 | **P3** | `.gitignore` will drop `.env.example` once git exists | ✅ Resolved |
| 16 | **P3** | Minor inline business logic in a couple of pages | Not fixed |
| 17 | **P3** | No enforcement that new tenant models are added to `TENANT_SCOPED_MODELS` | ✅ Resolved |

**Root-cause framing:** almost every P2/P3 here traces back to the same root cause — this project was built entirely through fast, incremental, feature-driven AI-assisted sessions with no version control and no test safety net (P0s). That development mode is *why* small duplications (P2-7) and drift (P2-8, P2-9) accumulated instead of being caught, and *why* nothing has forced a decision on the two competing UI systems (P2-12) or an updated README (P2-11). Fixing the two P0s doesn't directly fix any P2/P3, but it's the precondition that makes fixing them *safe* — see §9 execution order.

---

## 7. Proposed Target Architecture

The existing architecture is fundamentally sound for this project's size and stage — **this is not a rewrite candidate.** Recommendation: keep the shape, close the gaps.

**Keep, unchanged:**
- Next.js App Router + Server Components + Server Actions as the only data/mutation mechanism (no REST/API layer needed beyond NextAuth's own route — introducing one now would be over-engineering).
- `scopedPrisma()` as the single tenant-isolation choke point.
- One `lib/actions/<domain>.ts` file per domain — already well-decomposed, no god-service risk observed.
- DB-backed RBAC via `RolePermission`, editable from `/admin/roles` — already exactly the target shape.
- No client-side global state library — server-rendered pages + local `useState`/`useActionState` is correct for this app's interaction shape; introducing Redux/Zustand/Context here would be unnecessary complexity.

**Add (small, additive, non-breaking):**
- `lib/tours/`, `lib/departures/`-style pure-logic modules for any derivation logic that grows beyond a couple of lines inline in a page (starting point: the tours-list sort).
- A single centralized fix point for Problem P1-6 (dynamic rendering) — e.g. have `requireSession()`/`requirePlatformAdmin()` call `connection()` (from `next/server`) once, internally, so every caller is automatically protected instead of relying on remembering `export const dynamic = "force-dynamic"` per file.
- A generic `<PillPicker>` (single-select + optional custom "Other") component, with `RegionPicker` built on a shared multi-select pill primitive — collapses 3 near-duplicate files into 1 shared + 2 thin wrappers.
- A minimal server-side logging convention (even `console.error` with a consistent shape/prefix is enough at this stage — does not need a full observability platform yet).
- A basic rate limiter on the 3 auth-entry Server Actions (in-memory token bucket is sufficient pre-scale; Vercel KV/Upstash if deployed to Vercel and traffic justifies it later).

**Fix (bug-class, not architecture):**
- The `deleteTourImage` path-traversal input validation.
- Resolve the schema/UI drift columns — either implement the missing UI (itinerary/included/excluded, org logo/address) or drop them in a migration; this is a **product decision**, not a pure refactor, and should be confirmed with the user before either path is taken.

**Decide, don't default:**
- Commit to shadcn/ui *or* drop the scaffold. Given 9/10 primitives are unused and the hand-rolled approach is already consistent everywhere it's actually used, the lower-risk default is: **remove the unused scaffold**, keep hand-rolled Tailwind, and only reach for a shadcn primitive again if a genuinely complex interactive pattern (e.g. a real `<Select>` with keyboard nav) is needed — but this should be confirmed with the user since it's a standing convention decision, not just dead-code cleanup.

---

## 8. Proposed Module Responsibilities

No structural renaming is proposed — the existing module boundaries are correct. This section documents the *intended* responsibility of each layer as a reference for future work, since no such document currently exists:

- **`app/*`** — routing, layout, and presentation only. A page may call `requireSession`/`requirePermission` and read via `scopedPrisma`/`prisma` directly (this is idiomatic Next.js Server Components, not a violation), but any non-trivial derivation/transformation belongs in `lib/`.
- **`lib/actions/*`** — the only place mutations happen. Each file: auth guard first line, Zod validation second, then the mutation. Cross-domain logic (e.g. booking capacity) is imported from a shared `lib/<domain>/` module, never duplicated across action files.
- **`lib/auth/*`** — the only place authorization decisions are computed. `permission-keys.ts` (client-safe constants) vs `permissions.ts` (server-only DB resolution) split must be preserved — it exists specifically so client components can filter nav items without bundling a DB client.
- **`lib/db.ts` / `lib/db/scoped.ts`** — the only two ways the app touches Postgres. No other file should instantiate a Prisma client.
- **`lib/bookings/*`, `lib/dashboard/*`** — pure or near-pure business logic, framework-agnostic where possible (already the case).
- **`components/*`** — presentation + local interaction state only. No direct Prisma/DB imports (verified: none found). Server Actions may be imported directly into client components as `action` props — this is idiomatic and not a smell.
- **`prisma/schema.prisma`** — source of truth for all persisted state. Every model gains a comment `///` explaining its purpose (already the convention — preserve it) and a decision on whether it's tenant-scoped (and thus must be added to `TENANT_SCOPED_MODELS`).

---

## 9. Refactoring Strategy

1. **Do not touch business logic until P0s are closed.** Every fix below becomes low-risk once there's a git history to diff against and a test suite that would catch a tenant-isolation or RBAC regression.
2. **Additive first, subtractive second.** Add the shared `<PillPicker>`, add tests, add logging — before deleting the dead shadcn files or dropping schema columns, so there's always a working state to fall back to.
3. **Product decisions get surfaced, not defaulted.** Problems P2-8 (schema drift) and P2-12 (which UI system to keep) are not pure engineering calls — flag them to the user with the two concrete options each before acting.
4. **One fix, one commit, one verification pass.** Given the size of this codebase and its history of successful incremental delivery (documented in `REFACTOR_PROGRESS.md` going forward), continue that pattern rather than batching unrelated fixes.

---

## 10. Risks

- **No safety net for tenant isolation regressions.** This is the single highest-consequence category of bug this app can have (cross-agency data leakage). Until a test exists that seeds two orgs and asserts zero cross-visibility, every refactor — even a "safe-looking" one — carries this risk silently.
- **The P1-6 caching characteristic is empirically mitigated, not root-caused.** The exact mechanism inside this customized Next.js build was not conclusively identified (Full Route Cache, Client Router Cache, and `React.cache()` were each tested and ruled out or found insufficient alone; `force-dynamic` + `revalidatePath` together resolved the reproduced case, with a short eventual-consistency window). Treat any future symptom of "a change doesn't show up immediately" as a known-possible instance of this class, not a new bug, and prefer the centralized-fix approach in §7 over sprinkling more per-file `force-dynamic` exports.
- **No rollback path for schema changes.** Migrations are applied via a manual workaround (`prisma migrate diff` → hand-placed file → `prisma migrate deploy`) because `prisma migrate dev` cannot run non-interactively in this environment. This works but has no automated down-migration story; a bad migration requires a hand-written corrective migration, not a revert.
- **Deleting the dead shadcn primitives is technically zero-risk today** (confirmed zero imports) **but should still land as its own isolated commit** so it's trivially revertible if this audit's import-graph check missed a dynamic/string-based import somewhere (none were found, but dynamic imports wouldn't show up in a static grep).

---

## 11. Recommended Execution Order

1. **Initialize git.** First commit = current working state, verbatim. This alone de-risks everything after it.
2. **Stand up a minimal test harness:**
   - Vitest (or similar) for pure functions: `calculateBookingTotal`, `findResourceConflict`-adjacent logic, `roleHasPermission`/permission resolution.
   - A committed Playwright suite (promote the ad hoc scratchpad scripts used throughout this project's history into a real `e2e/` directory) covering, at minimum: (a) tenant isolation — seed two orgs, assert zero cross-visibility across every tenant-scoped model; (b) RBAC — one test per role verifying its actual permission boundary; (c) the overbooking race.
3. **P1 fixes**, each as its own commit: path traversal in upload, rate limiting on auth actions, centralize the `force-dynamic`/`connection()` fix, add a basic error-logging convention.
4. **P2 fixes**, product decisions surfaced first: confirm schema-drift columns' fate and UI-system fate with the user, *then* execute; independently, extract the shared `<PillPicker>`, align guest-booking pricing, replace the hardcoded marketplace-closed list with a documented flag, write a real `README.md`.
5. **P3 cleanup**: delete confirmed-dead files, fix `package.json`/`.gitignore` classification issues.

This order is also reflected, with live status, in `docs/REFACTOR_PROGRESS.md`.
