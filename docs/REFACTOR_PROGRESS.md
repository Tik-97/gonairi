# Refactor Progress Log

This file tracks the state of the audit/refactor effort described in `docs/ARCHITECTURE_AUDIT.md`.
**Read that file first** — this one only tracks status and next actions, it doesn't re-explain findings.

---

## Current Phase

**Phase 0 — Audit (COMPLETE).** No production code was modified. Repository was analyzed end-to-end: full `app/`, `lib/`, `components/`, `prisma/` trees; `auth.ts`; `proxy.ts`; all config files; dependency graph; dead-code cross-reference; tenant-isolation spot-check of every raw-`prisma` usage outside `scopedPrisma`.

**Phase 1 — De-risk (COMPLETE).** Git initialized + pushed (step 1). Test harness stood up: Vitest for pure logic + DB-integration tests for tenant isolation, RBAC, and the overbooking race (step 2).

**Phase 2 — P1 architectural fixes (COMPLETE for the items in scope this session).** Path traversal fixed, dynamic-rendering opt-in centralized, duplicated pricing logic consolidated. See "Completed Work" and "Important Discoveries" below — one specific finding (P1-6, caching) is **not** fully resolved despite this session's fix, and that is documented honestly rather than claimed done.

**Phase 3 — Business-logic/module refactor (COMPLETE for the items in scope this session).** Consolidated duplicated types, validation, and business rules across `lib/actions/*`; extracted two page-embedded derivations into testable `lib/` modules; found and fixed one real pre-existing bug along the way (see "Important Discoveries"). Rate limiting, error-logging convention, and the two user-facing product decisions are still open — see "Next Phase" below.

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

### This session (Phase 1 step 2 + Phase 2 P1 fixes)

- [x] **Test harness stood up.** Vitest added (`vitest.config.mts`, `tests/setup.ts` loads `.env` via `dotenv/config`, `tests/stubs/server-only.ts` no-ops the `server-only` marker package so `"server-only"`-guarded files can be imported from plain Node — see that file's comment for why). `npm test` runs everything; **31 tests across 6 files, all passing** against the real dev database (this project's established testing convention — no separate test DB exists, see `ARCHITECTURE_AUDIT.md` §10 Risks).
  - `lib/bookings/pricing.test.ts` — pure unit tests for `calculateBookingTotal` (9 cases: full/half/free pricing, discount clamping, rounding, and an explicit case proving it's algebraically identical to the guest-flow's `unitPrice * paxCount`).
  - `lib/auth/permissions.test.ts` — pure unit tests for `isBackOfficeRole` and structural invariants of `PERMISSION_GROUPS`/`OWNER_PERMISSION_FLOOR`/`ROLES` (catches e.g. a permission added to `PERMISSIONS` but never wired into a `PERMISSION_GROUPS` entry, so it'd be invisible in the SA dashboard).
  - `lib/db/scoped.test.ts` — **new static regression guard for audit finding P3-17**: parses `prisma/schema.prisma` directly and asserts every model with an `organizationId` field is present in `TENANT_SCOPED_MODELS` (now exported from `lib/db/scoped.ts` for exactly this purpose), and vice versa. This is the automated enforcement the audit flagged as missing — a forgotten entry now fails `npm test`, not "eventually discovered in production."
  - `tests/integration/tenant-isolation.test.ts` — seeds two real ephemeral orgs, proves `scopedPrisma` blocks cross-org read/update/delete (including an IDOR-style exact-id lookup) across two different models, and proves the extension's `organizationId` **always wins even if a caller passes a different one** (a stronger, more realistic version of "stamps it automatically," since real callers must pass *something* to satisfy Prisma's generated types — see the test file's comment).
  - `tests/integration/rbac.test.ts` — mutates and restores OPERATOR's real `RolePermission` rows (captured before, restored after) to prove `roleHasPermission()` reflects a write on the very next call, without asserting a rigid snapshot of "today's defaults" (which are meant to be editable).
  - `tests/integration/overbooking-race.test.ts` — fires `CAPACITY + 4` concurrent `createBooking()` calls at a departure with `capacity: 3`; asserts exactly 3 succeed, the rest throw `NotEnoughAvailabilityError`, and `bookedCount` never exceeds `capacity`. This is a real concurrency test against the real DB, not a mock — the whole point is what happens when requests overlap.
  - Verified empirically (not just assumed) that `React.cache()` does **not** memoize outside a React render context — confirmed via a throwaway probe before relying on this for the RBAC test's sequential mutate-then-check design, then deleted the probe.
- [x] **Fixed path traversal in `deleteTourImage`** (`lib/actions/upload.ts`, audit finding P1-3). Added `isInsideDirectory()` — resolves the caller-supplied `url` and checks real path containment via `path.relative()` (immune to the classic `startsWith(prefix)` sibling-directory pitfall, e.g. `uploads/tours-evil/` no longer passes a naive prefix check) before `unlink`ing. Real bug fix, not a patch — verified by inspection since exercising it live requires an authenticated session plus a crafted `../` payload, which wasn't proportionate to set up for this one fix; typecheck/lint/build all pass with the change.
- [x] **Centralized the dynamic-rendering fix for audit finding P1-6** — see "Important Discoveries" below for the full, honest result (partial). Replaced the scattered `export const dynamic = "force-dynamic"` in `app/dashboard/layout.tsx` and `app/admin/(protected)/layout.tsx` with `await connection()` (from `next/server`) called once inside `requireSession()` (`lib/auth/session.ts`) and `requirePlatformAdmin()` (`lib/auth/platform-admin-session.ts`) — the two functions virtually every protected page/Server Action already calls as its first line. Also added the same `connection()` call directly to `app/admin/page.tsx`, which calls `auth()` directly (by necessity — it redirects to *either* destination) and had **no** dynamic-rendering protection at all before this session, a gap the original audit missed.
- [x] **Consolidated duplicated core business logic**: `createGuestBooking` (`lib/actions/guest-bookings.ts`, audit finding P2-9) now calls the shared `calculateBookingTotal()` instead of a parallel `unitPrice * paxCount` calculation. Proven behavior-preserving both by the dedicated unit-test case and by the pricing function's own algebra (empty travelers + 0% discount reduces exactly to that multiplication).
- [x] Full verification pass: `npx tsc --noEmit` (clean), `npm run lint` (clean), `npm run build` (clean, all `/dashboard/*` and `/admin/*` routes still classified `ƒ Dynamic` by Next's own build output), `npm test` (31/31 passing), plus live Playwright regression runs of last session's `check-permissions.js` (all 5 roles) and `check-sa-roles.js` (SA permission-edit flow) — **both still pass with zero changes needed**, confirming the auth-layer refactor didn't regress anything.

### This session (Phase 3 — business-logic/module refactor)

Scope: a fresh, targeted pass across `lib/actions/*`, `lib/`, and the two page components with the most inline derivation, looking specifically for duplicated types/validation/business rules and business logic sitting in the wrong layer (per this session's explicit brief). This is a different lens than the original audit (which was breadth-first across the whole repo) — narrower, deeper, and code-only (no docs/git/product-decision work this time).

**Duplicated types and validation consolidated** (all behavior-preserving — verified via the full `npm test` + live Playwright runs below, not just typecheck):

- [x] **`lib/form-state.ts`** (new) — the `FormState = { error?: string } | undefined` type was independently redefined, verbatim, in **9** `lib/actions/*.ts` files, and the Zod-error-to-FormState mapping (`return { error: parsed.error.issues[0]?.message ?? "Invalid input." }`) was duplicated **13** times across those same files. Both now live in one module: `FormState` (re-exported... see the build-error note below) and `formStateFromZodError(error: z.ZodError)`. `lib/actions/organization.ts` keeps its own `FormState` (it has an extra `success?: boolean` field — genuinely a different type, not consolidated, with a comment explaining why).
- [x] **`lib/phone.ts`** — added `optionalPhoneField`, a shared Zod schema fragment (`z.string().trim().optional().refine(isValidOptionalPhone, "Enter a valid phone number.")`) that was repeated identically in 6 places (`bookings.ts`, `customers.ts`, `organization.ts`, `staff.ts` ×2, `vehicles.ts`). **Deliberately not applied** to `guest-bookings.ts`'s phone field — that form uses a plain `<input>`, not the `<PhoneInput>` E.164-normalizing component the other 6 pair with, so applying the same strict validation there would reject legitimate free-text phone numbers from guests. Confirmed by reading `components/guest-booking-form.tsx` before deciding — this is an intentional difference, not a missed duplicate.
- [x] **`lib/slug.ts`** — added `uniqueSlug(base, isTaken)`, a generic "append -2, -3, ... until unique" retry helper. `uniqueTourSlug` (`lib/actions/tours.ts`) and `uniqueOrganizationSlug` (`lib/actions/auth.ts`) were two independent implementations of the identical algorithm against different tables; both now call the shared helper with their own `isTaken` query.
- [x] **`lib/actions/departures.ts`** — the vehicle/driver/guide assignment check inside `createDeparture` was three near-identical ~12-line blocks (look up the resource, error if missing, error if already booked that day — same shape, different field names and wording). Replaced with a small `ASSIGNABLE_RESOURCES` config table + one `checkResourceAssignments()` loop. Exact same order (vehicle → driver → guide), exact same error messages, exact same short-circuit-on-first-problem behavior — verified live (see below) that the conflict error message is byte-identical to before.

**Business logic extracted out of page components** (per this session's explicit "business logic inside UI components" focus):

- [x] **`lib/tours/sort.ts`** (new) — `sortByNextDeparture()`, pulled out of `app/dashboard/tours/page.tsx`'s inline `.sort()` (this was audit finding P3-16). 4 unit tests.
- [x] **`lib/customers/stats.ts`** (new) — `calculateCustomerBookingStats()`, pulled out of `app/dashboard/customers/[customerId]/page.tsx`'s inline derivation of 6 stats (confirmed/cancelled/no-show counts, total spent, cancellation rate) from a customer's booking history. Not previously flagged in the audit — found this session. 6 unit tests.

**A real, pre-existing bug found and fixed** (unrelated to any of the above — found while live-testing the tour-creation flow, see "Important Discoveries" #3 for the full mechanism):

- [x] **`components/region-picker.tsx`** — removed a hidden `<input type="checkbox" required checked={selected.length > 0} onChange={() => {}} />` used as a native-validation trick to block submitting a tour with zero regions selected. This desyncs from React after React 19's automatic uncontrolled-form-reset-on-Server-Action-submission: the checkbox's live DOM `.checked` gets reset to `false` by the browser, but React's next render computes the *same* `checked` prop value as before (`selected.length > 0` hadn't changed) and skips re-writing the DOM per its diffing rules — leaving the checkbox permanently stuck unchecked, silently blocking all future submissions even with a region validly selected. Removed the checkbox entirely; the existing client-side message (`{touched && selected.length === 0 && <p>...}`) and the already-present server-side Zod check (`regions: z.array(...).min(1, "Select at least one region.")` in `TourSchema`) together fully cover the same requirement without the fragile native-checkbox mechanism. Verified live: a tour can now be created immediately after a failed validation attempt without re-touching the region picker.

**A real build-time constraint discovered and worked around** (not a bug in *my* code, but worth recording precisely since it will bite the next person who tries the "obvious" fix):

- [x] Next.js's `"use server"` file bundler in this custom build **cannot handle `export type { X }` re-exports** inside a Server Actions file — it tries to generate an action reference for every named export, including type-only ones, and `next build` fails with `Export FormState doesn't exist in target module` (TypeScript itself doesn't catch this; only `next build` does — `tsc --noEmit` and `next dev` were both silent about it). Original (broken) attempt: `import type { FormState } from "@/lib/form-state"; export type { FormState };` in each of the 9 action files, so consuming components' existing `import type { FormState } from "@/lib/actions/<domain>"` wouldn't need to change. **Fix**: don't re-export from "use server" files at all — each action file just does `import type { FormState } from "@/lib/form-state";` for its own local use, and the **8** consuming form components (`components/*-form.tsx`) now import `FormState` directly from `@/lib/form-state` instead of from the action file. Plain `export type CustomerSearchResult = {...}` (an original declaration, not a re-export) in `customers.ts` was unaffected and left as-is — confirmed this distinction by checking which files actually appeared in the build error output.
- [x] Full verification pass: `npx tsc --noEmit` (clean), `npm run lint` (clean), `npm run build` (clean — this is what caught the re-export issue above), `npm test` (**41/41 passing**, up from 31 — 10 new unit tests for the two extracted `lib/` modules), plus live Playwright runs: a full create-tour-with-validation-error-then-resubmit flow (exercises `formStateFromZodError`, `uniqueSlug`, `sortByNextDeparture`, and the region-picker fix together), a create-customer-then-view-detail flow (exercises `optionalPhoneField` and `calculateCustomerBookingStats`), a same-vehicle-same-day conflict flow (exercises `checkResourceAssignments`, confirmed the error message text is unchanged), and a re-run of the prior session's full `check-permissions.js` 5-role suite (all still passing, confirming nothing in the auth/RBAC layer regressed).

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

1. **Both P0s are now closed** (git — prior session; tests — this session). Tenant isolation, RBAC, and the overbooking race all now have automated, passing, DB-backed regression coverage (`tests/integration/*`, `lib/db/scoped.test.ts`). Structural refactors are meaningfully lower-risk now — a regression in any of these three properties will fail `npm test`, not go unnoticed.
2. **P1-6 (the Next.js caching/staleness characteristic) is NOT fully resolved — this is the most important thing to carry forward, and it contradicts the audit's original tentative recommendation.** This session tried the audit's own recommended fix (centralize dynamic-rendering opt-in via `connection()`) and it did **not** eliminate the bug. Full account of what was tried, in order, across **two sessions**:
   - `export const dynamic = "force-dynamic"` on 2 layout files (prior session) — insufficient alone.
   - `revalidatePath()` in the mutating Server Action (prior session, still present) — combined with the above, the *prior* session concluded this resolved it with a short lag. It does not fully resolve it (see below).
   - `await connection()` centralized inside `requireSession()`/`requirePlatformAdmin()`, replacing the scattered `force-dynamic` exports (**this session**) — reproduced the **exact same** staleness pattern as before.
   - **New this session: confirmed the bug reproduces identically in a `next build && next start` production server, not just `next dev`.** This rules out any Turbopack-dev-mode-only explanation (HMR, dev module caching) that either session might have suspected.
   - **New this session: reconfirmed the bug is bounded and self-heals within ~1-2 real seconds** (a settle delay between the write and the read makes every case pass, in both dev and prod), and **reconfirmed the actual security boundary (`requirePermission` denying/redirecting a now-unauthorized action) is instant and correct in every single test run, with no exception, in both sessions.** Only a cosmetic UI affordance (whether a button renders) on an already-rendering (200) page can lag; a page that itself redirects/denies is never observed stale.
   - **What's now ruled out as the sole cause:** Full Route Cache via `force-dynamic` (insufficient alone), `React.cache()` (verified via direct probe: does not memoize outside a render context), Turbopack dev-mode artifacts (reproduces in production), and `connection()` (this session, insufficient alone even centralized). `revalidatePath` remains in place and may be contributing to the bound being as short as ~1-2s rather than longer, but does not eliminate it either.
   - **Do not re-attempt "centralize the dynamic export" as a fix again** — it's been tried, via two different implementations, across two sessions, and both left the same residual ~1-2s window. If a future session wants to keep chasing the root cause, the next untried angle is probably Next.js's Client Router Cache interacting with `page.goto()`-triggered navigations in a way not yet isolated, or an HTTP keep-alive/connection-reuse artifact — both would require lower-level network tracing (e.g. inspecting raw response bytes/timing across the reused connection) rather than another Next.js-config-level attempt.
   - **The `connection()` centralization is being kept anyway** — even though it didn't solve P1-6, it's a strict architectural improvement on its own merits (single choke point instead of 2 scattered per-file exports; now also covers `app/admin/page.tsx` and every individual dashboard/admin page and Server Action, none of which had *any* dynamic-rendering protection before beyond inheriting from a layout).
3. **Two product decisions are waiting on the user, not on more analysis:**
   - What to do with schema columns that have no UI (`Tour.itinerary`/`included`/`excluded`/`languagesOffered`, `Organization.logoUrl`/`address`) — implement or drop?
   - Keep hand-rolling everything and delete the unused shadcn scaffold, or commit to shadcn and migrate the hand-rolled components onto it?
   Do not decide either unilaterally — see `ARCHITECTURE_AUDIT.md` §9 point 3.
4. **The RBAC system (built two sessions ago) is the template for what "good" looks like in this codebase** — DB-backed, one choke point, Super-Admin-editable, and now also test-covered. Use it as the reference pattern when proposing fixes elsewhere.
5. **`README.md` has never been touched** — it's still `create-next-app` boilerplate. A future session picking this project up cold (without this audit) would have no on-ramp. This audit + progress file are now that on-ramp; keep them current.
6. **Test-writing conventions established this session, follow them going forward:** `server-only`-guarded files need `"server-only"` aliased to `tests/stubs/server-only.ts` (see `vitest.config.mts`) to be importable from Vitest at all — don't rediscover this by hitting the thrown error again. DB-touching tests live under `tests/integration/`, always seed ephemeral/uniquely-stamped data, and always clean up in `afterAll` (mutate-and-restore for shared/global rows like `RolePermission`, delete-cascade via the parent `Organization` for tenant-scoped rows). Pure-logic tests are colocated next to the code they test (`lib/**/*.test.ts`), matching how `lib/` is already organized by domain.
7. **`"use server"` files cannot `export type { X }` (a re-export), only original declarations — this only fails at `next build`, not at `tsc --noEmit` or `next dev`.** Discovered this session while consolidating `FormState`: re-exporting an imported type from a Server Actions file breaks the build with `Export FormState doesn't exist in target module`, because the action-bundler tries to generate a server-action reference for every named export, type-only or not. If a future session wants a type shared *from* a `lib/actions/*.ts` file, either (a) declare it there originally (fine — `CustomerSearchResult` in `customers.ts` works this way), or (b) put it in a plain `lib/` module and have every consumer — including other action files — import it from there directly, never re-exported through a `"use server"` file. Always run `npm run build` (not just `tsc --noEmit`) after touching exports in any `lib/actions/*.ts` file.
8. **A real, narrow bug was found and fixed in `components/region-picker.tsx`** (see "Completed Work" above for the full mechanism: a hidden native-validation checkbox desyncs from React state after React 19's automatic form-reset-on-submission). If a similar "hidden checkbox tied to `checked={someState}` for native `required` validation" pattern is ever reused elsewhere in this codebase (none currently found), the same desync risk applies — prefer relying on the existing client-side message + server-side Zod validation instead, as this fix now does.

---

## Next Phase

**Phase 4 — remaining P1/P2 items**, per `ARCHITECTURE_AUDIT.md` §11 steps 3-4 (adjusted: path traversal, dynamic-rendering centralization, guest-pricing duplication, and the business-logic/module consolidation pass are now done — see "Completed Work" above):

1. Rate limiting on the 3 auth-entry Server Actions (`login`, `registerOrganization`, `loginPlatformAdmin`) — audit finding P1-4. Not started.
2. A basic error-logging convention (even a consistent `console.error` shape is enough at this stage) — audit finding P1-5. Not started.
3. Surface the two product decisions to the user (schema-drift columns; shadcn scaffold vs. hand-rolled) **before** acting on either — audit findings P2-8 and P2-12.
4. Once decided: extract the shared `<PillPicker>` (P2-7 — `category-picker.tsx`/`vehicle-type-picker.tsx` are still ~95% identical, and `region-picker.tsx` shares the same pill-rendering pattern; this session touched `region-picker.tsx` for the checkbox bug but deliberately did *not* do the larger pill-picker consolidation, since that's UI-component duplication rather than business logic and was out of this session's scope), replace the hardcoded marketplace-closed list with a documented flag (P2-10), write a real `README.md` (P2-11).
5. P3 cleanup: delete the 10 confirmed-dead component files, fix `shadcn`'s `package.json` classification.

Optionally, if the user wants it pursued further: a genuine root-cause investigation of P1-6 (see "Important Discoveries" #2 above for what's already been ruled out and the one untried angle — Client Router Cache / connection-reuse tracing). This is *not* recommended as a default next step; it's already had disproportionate effort across two sessions relative to its now well-bounded, non-security impact.

## Exact Next Recommended Action

Both P0s, this session's P1 architectural fixes, and this session's business-logic/module consolidation are committed and pushed to **https://github.com/Tik-97/gonairi** (private, remote `origin`, branch `master`). Ask the user which of the "Next Phase" items above to do next — items 1-2 (rate limiting, logging) can be done unilaterally; items 3-4 need the two product decisions surfaced first, per `ARCHITECTURE_AUDIT.md` §9 point 3 ("product decisions get surfaced, not defaulted"). Do not decide the schema-drift or UI-system question without asking.
