# Refactor Progress Log

This file tracks the state of the audit/refactor effort described in `docs/ARCHITECTURE_AUDIT.md`.
**Read that file first** — this one only tracks status and next actions, it doesn't re-explain findings.

---

## Current Phase

**Phase 0 — Audit (COMPLETE).** No production code was modified. Repository was analyzed end-to-end: full `app/`, `lib/`, `components/`, `prisma/` trees; `auth.ts`; `proxy.ts`; all config files; dependency graph; dead-code cross-reference; tenant-isolation spot-check of every raw-`prisma` usage outside `scopedPrisma`.

**Next phase to start: Phase 1 — De-risk (git + tests).** Not started. See "Next Phase" section below before doing anything else.

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
- [x] Confirmed: **no git repository**, **no test framework**, **no `tests/` directory anywhere.**
- [x] `ARCHITECTURE_AUDIT.md` written with full findings, prioritization, target architecture, and execution order.

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

1. **No git, no tests — these are the two P0s and the precondition for everything else.** Do not attempt any refactor beyond the audit until at least git is initialized.
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

**Phase 1 — De-risk.** Scope, in order (matches `ARCHITECTURE_AUDIT.md` §11):

1. Initialize git in `c:\Users\Tigran\Desktop\ToursOrganizer`, first commit = current state as-is (including this audit).
   - **Before the first commit:** fix `.gitignore`'s `.env*` pattern to add `!.env.example` (Problem P3-15), or the example file will be silently excluded from that very first commit.
2. Stand up a minimal test harness (Vitest for pure logic + a promoted Playwright `e2e/` suite). Priority test content, in order: tenant-isolation cross-org test, per-role RBAC boundary test, overbooking-race test.
3. Only after 1–2 are done: proceed to the P1 fixes listed in the audit (`§11` steps 3+).

## Exact Next Recommended Action

**Ask the user whether to proceed with git initialization now** (it's a workspace-level action — creating a `.git` directory and making a first commit — that this audit's instructions explicitly scoped out of the analysis phase, and it's good practice to confirm before taking the first action with real, lasting side effects). If approved:

```bash
cd "c:\Users\Tigran\Desktop\ToursOrganizer"
# first: add `!.env.example` to .gitignore (see Discovery #6 above / Problem P3-15)
git init
git add -A
git commit -m "Initial commit: GoNairi multi-tenant tour agency SaaS"
```

Then proceed to test-harness setup (Phase 1, step 2) in the same or a follow-up session, updating this file's "Completed Work" and "Current Phase" sections as each step lands.
