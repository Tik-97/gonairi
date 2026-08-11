# Refactor Progress Log

This file tracks the state of the audit/refactor effort described in `docs/ARCHITECTURE_AUDIT.md`.
**Read that file first** — this one only tracks status and next actions, it doesn't re-explain findings.

---

## Current Phase

**Phase 0 — Audit (COMPLETE).** No production code was modified. Repository was analyzed end-to-end: full `app/`, `lib/`, `components/`, `prisma/` trees; `auth.ts`; `proxy.ts`; all config files; dependency graph; dead-code cross-reference; tenant-isolation spot-check of every raw-`prisma` usage outside `scopedPrisma`.

**Phase 1 — De-risk, step 1 of 2 (git) — COMPLETE.** Git initialized, pushed to GitHub. Step 2 (test harness) not started — see "Next Phase" below.

---

## Completed Work

- [x] Directory structure mapped (3 levels deep, all of `app/`, `lib/`, `components/`, `prisma/`, `scripts/`, `types/`).
- [x] `package.json` dependencies cross-checked against actual usage — all runtime deps confirmed used except `shadcn` (CLI tool, misclassified).
- [x] Full `prisma/schema.prisma` read (13 models, 9 enums) and cross-referenced against application code for unused columns.
- [x] All 5 migrations listed (`prisma/migrations/`) — history is coherent, no anomalies.
- [x] Every file in `lib/actions/*` (12 files) read or grepped for raw-`prisma`-vs-`scopedPrisma` usage; every raw usage individually verified safe.
- [x] `lib/auth/*`, `lib/bookings/*`, `lib/dashboard/stats.ts`, `lib/db.ts`, `lib/db/scoped.ts` read in full.
- [x] All `app/(public)/*` marketplace pages read (confirmed: functional, correctly scoped to `isPublished`, but unreachable — `proxy.ts` redirects the whole route group).
- [x] `auth.ts` and `proxy.ts` (middleware) read in full — dual-session-type isolation (tenant vs platform-admin) verified consistent.
- [x] Component-level duplication check: `category-picker.tsx`, `region-picker.tsx`, `vehicle-type-picker.tsx` confirmed near-duplicate.
- [x] Dead-code sweep of `components/`: 9/10 `components/ui/*` shadcn primitives confirmed zero-imports; `components/ornaments/flying-bird.tsx` confirmed zero-imports.
- [x] Security spot-check: `dangerouslySetInnerHTML` (none found), path handling in `lib/actions/upload.ts` (path-traversal-shaped bug found), auth flows (no rate limiting found).
- [x] Confirmed (at audit time): **no git repository**, **no test framework**, **no `tests/` directory anywhere.**
- [x] `ARCHITECTURE_AUDIT.md` written with full findings, prioritization, target architecture, and execution order.
- [x] **Git initialized** in the project root; `.gitignore` fixed first (`!.env.example` negation added, Problem P3-15 resolved).
- [x] Verified staged content before first commit — no `.env`, `node_modules`, `.next`, `generated/prisma`, or `public/uploads` included; confirmed clean.
- [x] Repo-local git identity set (`user.name`/`user.email`, local scope only, derived from the authenticated `gh` account — no global config touched).
- [x] First commit made (`3846841`) on `master`.
- [x] Private GitHub repo created and pushed: **https://github.com/Tik-97/gonairi** (remote `origin`, branch `master` tracking `origin/master`).

---

## Files Analyzed (exhaustive for this phase)

**Config/root:** `package.json`, `.env.example`, `.gitignore`, `next.config.ts`, `tsconfig.json`, `prisma.config.ts`, `eslint.config.mjs`, `README.md`, `AGENTS.md`/`CLAUDE.md`, `auth.ts`, `proxy.ts`, `types/next-auth.d.ts`

**`lib/`:** all files in `lib/actions/`, `lib/auth/`, `lib/bookings/`, `lib/dashboard/`, plus `lib/db.ts`, `lib/db/scoped.ts`, `lib/format.ts`, `lib/phone.ts`, `lib/slug.ts`, `lib/utils.ts`

**`app/`:** every `page.tsx`/`layout.tsx` under `(auth)/`, `(public)/`, `admin/`, `dashboard/`, `api/`

**`components/`:** every file — full read for the 3 picker components and `booking-form.tsx` and `customer-combobox.tsx`; line-count + import-graph check for the rest (`components/ui/*`, `components/ornaments/*`, dashboard chrome components)

**`prisma/`:** `schema.prisma` in full; migration filenames (not full SQL diff-by-diff, since schema.prisma is the authoritative current state)

**Not yet deeply read (low audit priority, flagged if revisited):** `components/date-time-picker.tsx`, `components/phone-input.tsx`, `components/tour-form.tsx`, `components/staff-form.tsx`, `components/vehicle-form.tsx`, `components/departure-form.tsx`, `components/organization-settings-form.tsx`, `components/dashboard/bookings-trend-chart.tsx` — these were included in the line-count/duplication sweep but not read line-by-line; no red flags surfaced from their size (all under 250 lines) or import graph.

---

## Important Discoveries (carry these forward — do not re-derive)

1. **No tests is still the outstanding P0.** Git is done (see above) — do not attempt structural refactors until the minimal test harness (tenant isolation, RBAC, overbooking race) lands.
2. **Tenant isolation is sound today.** Single choke point (`scopedPrisma`), every exception manually verified. The risk is *regression*, not a current bug — hence the P0 priority on tests, not on fixing isolation itself.
3. **The Next.js caching gotcha (`ARCHITECTURE_AUDIT.md` Problem P1-6) is real, reproduced empirically this session, and only partially fixed.** Two spots have `force-dynamic`; the rest of the app has not been audited. If a future session hits "a permission/data change doesn't show up immediately," check this first before assuming a new bug — see the audit doc's §10 Risks for the recommended centralized-fix approach (`connection()` inside `requireSession()`/`requirePlatformAdmin()`).
4. **Two product decisions are waiting on the user, not on more analysis:**
   - What to do with schema columns that have no UI (`Tour.itinerary`/`included`/`excluded`/`languagesOffered`, `Organization.logoUrl`/`address`) — implement or drop?
   - Keep hand-rolling everything and delete the unused shadcn scaffold, or commit to shadcn and migrate the hand-rolled components onto it?
   Do not decide either unilaterally — see `ARCHITECTURE_AUDIT.md` §9 point 3.
5. **The RBAC system (built the session immediately prior to this audit) is the template for what "good" looks like in this codebase** — DB-backed, one choke point, Super-Admin-editable. Use it as the reference pattern when proposing fixes elsewhere.
6. **`README.md` has never been touched** — it's still `create-next-app` boilerplate. A future session picking this project up cold (without this audit) would have no on-ramp. This audit + progress file are now that on-ramp; keep them current.

---

## Next Phase

**Phase 1 — De-risk, step 2 of 2 (tests).** Stand up a minimal test harness:
- Vitest (or similar) for pure logic: `calculateBookingTotal`, permission resolution (`roleHasPermission`/`getRolePermissions`), any `findResourceConflict`-adjacent logic.
- A committed Playwright `e2e/` suite (promote the ad hoc scratchpad scripts used throughout this project's prior sessions into the repo, wired to a `test:e2e` script). Priority coverage, in order:
  1. Tenant isolation — seed two orgs, assert zero cross-visibility across every tenant-scoped model.
  2. RBAC — one test per role verifying its actual permission boundary (extend/reuse the `check-permissions.js`/`check-sa-roles.js` patterns from prior sessions).
  3. Overbooking race — concurrent booking requests against a near-full departure.

Only after this lands: proceed to the P1 fixes in `ARCHITECTURE_AUDIT.md` §11 (steps 3+) — path traversal in `deleteTourImage`, rate limiting on auth actions, centralizing the `force-dynamic`/`connection()` fix, a basic error-logging convention.

## Exact Next Recommended Action

Git is done — repo is live at **https://github.com/Tik-97/gonairi** (private, remote `origin`, branch `master`). Before writing any test code, confirm with the user:
1. Test runner choice for pure-logic tests (Vitest is the natural fit for a Next.js 16 project — no config beyond what's already in `package.json`'s `devDependencies` needs adding elsewhere, but this hasn't been confirmed with the user yet).
2. Whether to promote the existing ad hoc Playwright scripts (referenced in prior session history, not currently part of this repo) into a committed `e2e/` directory, or write the e2e suite fresh.

Then implement Phase 1 step 2 as its own commit (or small set of commits — one per test category is reasonable), push, and update this file's "Completed Work"/"Current Phase" sections.
