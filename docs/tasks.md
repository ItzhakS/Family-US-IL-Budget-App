# Tasks

**Rules**

- Each task below delivers **exactly one meaningful behavior change** in the system (or one isolated infrastructure slice with no user-visible change beyond what that slice implies).
- Tag format: `[TAG:Name]` maps to roadmap areas in `implementation-plan.md`.
- Order matters within phases; do not skip migrations or RLS tasks that later tasks depend on.
- **Done when** criteria are inline — stop when that condition is met, not before.

---

## Phase 0A — Project structure + routing

> Must complete before feature work. Establishes `src/` structure, routing, and service layer.

- [x] ~~**P0A.1** `[TAG:Structure]` Move source files into `src/` directory structure per `implementation-plan.md`. Update imports. — _Done when:_ `vite dev` and `vite build` succeed.~~
- [x] ~~**P0A.2** `[TAG:Structure]` Remove importmap from `index.html`; all deps come from `node_modules`. — _Done when:_ No importmap, app loads.~~
- [x] ~~**P0A.3** `[TAG:Structure]` Upgrade React to v19 in `package.json`. Fix any breaking changes. — _Done when:_ `react@19` installed, no type errors, app renders.~~
- [x] ~~**P0A.4** `[TAG:Router]` Install `react-router-dom@7`. Create `src/app/routes.tsx` with route definitions for `/dashboard`, `/maaser`, `/recurring`, `/investments`, `/yearly`, `/settings`, `/import`, `/login`. Redirect `/` → `/dashboard`. — _Done when:_ Routes defined, no runtime errors.~~
- [x] ~~**P0A.5** `[TAG:Router]` Create `AppShell.tsx` layout: extract header (logo, FX rate, year selector, user info) + nav tabs from `App.tsx`. Use `<Outlet />`. — _Done when:_ AppShell renders, child routes in outlet, looks identical.~~
- [x] ~~**P0A.6** `[TAG:Router]` Create page components: `DashboardPage`, `MaaserPage`, `RecurringPage`, `InvestmentsPage`, `YearlySummaryPage`. Move rendering logic from `App.tsx` tabs. — _Done when:_ Each page renders at its URL with existing functionality.~~
- [x] ~~**P0A.7** `[TAG:Router]` Implement auth route guard. Unauthenticated + non-demo users redirect to `/login`. — _Done when:_ `/dashboard` while logged out → `/login`. Demo mode bypasses.~~
- [x] ~~**P0A.8** `[TAG:Router]` Verify browser back/forward and direct URL access work. — _Done when:_ Navigation works, bookmarks work, no flash.~~

---

## Phase 0B — Services + state extraction

> Decouple data fetching and auth from `App.tsx` into hooks and services.

- [x] ~~**P0B.1** `[TAG:Services]` Create `AuthContext` + `useAuth` hook. Extract session management, login, logout, OAuth callback, demo mode, cross-tab sync from `App.tsx`. — _Done when:_ Auth works through context, `App.tsx` has no auth logic.~~
- [x] ~~**P0B.2** `[TAG:Services]` Create `transactionService.ts`. Abstract Supabase queries (fetch, create, update, delete). Handle snake_case ↔ camelCase. Demo mode → `demoStorage`. — _Done when:_ Service exports `getAll`, `create`, `update`, `delete`, `bulkCreate`. No direct Supabase calls in components.~~
- [x] ~~**P0B.3** `[TAG:Services]` Create `useTransactions` hook wrapping service. Manage loading, error, optimistic updates. Expose `{ transactions, add, update, remove, loading, error }`. — _Done when:_ All pages use hook for CRUD.~~
- [x] ~~**P0B.4** `[TAG:Services]` Create `useBudgetCalculations` hook. Extract computed values: `dashboardTransactions`, `availableYears`, `getMonthlyData()`, category totals. — _Done when:_ `DashboardPage` + `YearlySummaryPage` use hook.~~
- [x] ~~**P0B.5** `[TAG:Services]` Slim `App.tsx` to ~30 lines: `AuthProvider` > `ThemeProvider` > `RouterProvider` > `ToastContainer`. — _Done when:_ `App.tsx` < 50 lines, all features work.~~

---

## Phase 0C — Tailwind foundation

- [x] ~~**P0C.1** `[TAG:Tailwind]` Add Vite + Tailwind PostCSS config files. Wire `src/index.css` with `@tailwind` directives imported from entry. — _Done when:_ Utility classes compile.~~
- [x] ~~**P0C.2** `[TAG:Tailwind]` Remove CDN Tailwind from `index.html` **only after** local build produces equivalent styles. — _Done when:_ CDN removed, all screens render identically.~~
- [x] ~~**P0C.3** `[TAG:Tailwind]` Introduce semantic CSS variables for colors (light theme only). Map Tailwind theme keys to them. — _Done when:_ Variables defined, Tailwind config uses them.~~

---

## Phase 1 — List + categories + FX snapshot

- [x] ~~**P1.1** `[TAG:List]` Default transaction list to **current calendar month** (browser-local TZ), without removing access to other periods. — _Done when:_ Page load shows current month only; user can change filter.~~
- [x] ~~**P1.2** `[TAG:List]` Add text search control filtering by **description** (case-insensitive). — _Done when:_ Typing filters list instantly.~~
- [x] ~~**P1.3** `[TAG:List]` Extend search to also match **category**. — _Done when:_ Search finds transactions by category name.~~
- [x] ~~**P1.4** `[TAG:List]` Add **type** filter (Income / Expense / All). — _Done when:_ Filter narrows list correctly.~~
- [x] ~~**P1.5** `[TAG:List]` Add **currency** filter (ILS / USD / All). — _Done when:_ Filter narrows list correctly.~~
- [x] ~~**P1.6** `[TAG:Categories]` Create `categories` table with `family_id`, `name`, `kind`, `sort_order`, timestamps. Add RLS. — _Done when:_ Table exists, RLS enforced.~~
- [x] ~~**P1.7** `[TAG:Categories]` Seed each family's categories from `constants.ts` (migration or idempotent job). — _Done when:_ Every existing family has categories in DB.~~
- [x] ~~**P1.8** `[TAG:Categories]` Load category options in `TransactionForm` from Supabase (read-only, no CRUD UI yet). — _Done when:_ Form dropdown shows DB categories.~~
- [x] ~~**P1.9** `[TAG:Categories]` Add UI to **create** a new family category. — _Done when:_ New category appears in form select.~~
- [x] ~~**P1.10** `[TAG:Categories]` Add UI to **rename** an existing category. Define policy for past transactions in this task. — _Done when:_ Rename works, policy documented.~~
- [x] ~~**P1.11** `[TAG:FX]` Add nullable FX snapshot columns to `transactions` (e.g. `exchange_rate_usd_to_ils`, `fx_rate_date`). — _Done when:_ Columns exist, nullable.~~
- [x] ~~**P1.12** `[TAG:FX]` On **create transaction**, persist FX snapshot from current rate. — _Done when:_ New transactions have FX populated.~~
- [x] ~~**P1.13** `[TAG:FX]` On **edit transaction**, update FX snapshot **only when** amount or currency changes. — _Done when:_ Unrelated edits preserve original FX.~~

---

## Phase 2 — Recurring + copy

- [x] ~~**P2.1** `[TAG:Recurring]` Add DB + types for **cancelled** state (`recurring_cancelled_at` or `recurring_active`). Migration + TypeScript only. — _Done when:_ Column exists, types updated.~~
- [x] ~~**P2.2** `[TAG:Recurring]` Add UI action to **cancel recurring** for one transaction. — _Done when:_ Cancelled row stops appearing as recurring.~~
- [x] ~~**P2.3** `[TAG:Recurring]` Add DB + types for **remaining payment count** (nullable = unlimited). — _Done when:_ Column exists, types updated.~~
- [x] ~~**P2.4** `[TAG:Recurring]` Add UI to set **max remaining payments**. — _Done when:_ User can set count, value stored.~~
- [x] ~~**P2.5** `[TAG:Recurring]` Implement **decrement** of remaining count on explicit "record payment" event. — _Done when:_ Count decreases on payment.~~
- [x] ~~**P2.6** `[TAG:Copy]` Add **Copy** action on transaction row → opens `TransactionForm` prefilled as new. — _Done when:_ Copy button visible, form opens prefilled.~~
- [x] ~~**P2.7** `[TAG:Copy]` Prefill sets **date to today**, keeps other fields. — _Done when:_ Copied transaction has today's date.~~
- [x] ~~**P2.8** `[TAG:Recurring]` Promote recurring to a first-class entity: `recurring_templates` table (family-scoped, RLS) + `transactions.recurring_template_id` FK. — _Done when:_ Migration applied, types/services updated, FK populated for new rows.~~
- [x] ~~**P2.9** `[TAG:Recurring]` Auto-generate missing month transactions on app load from each active template's `start_month` through the current month (hard floor: never earlier than `start_month`). Idempotent via `last_generated_month` + per-month FK existence check. — _Done when:_ Reopening the app on a new month produces the row automatically; demo mode reproduces.~~
- [x] ~~**P2.10** `[TAG:Recurring]` Client-side legacy migration: collapse pre-existing `isRecurring` rows into synthetic templates and link them via `recurring_template_id`. Idempotent — only operates on un-linked rows. — _Done when:_ Existing recurring rows show up in the new Recurring page and future months auto-generate.~~
- [x] ~~**P2.11** `[TAG:Recurring]` Recurring page rewritten to show templates (active/cancelled/exhausted) with cancel action. Generated transactions are decoupled — editing one only affects that row. — _Done when:_ Page renders templates, cancel halts future generation.~~

---

## Phase 3 — Dark mode

- [x] ~~**P3.4** `[TAG:Dark]` Add dark theme CSS variables alongside light. — _Done when:_ Dark tokens defined.~~
- [x] ~~**P3.5** `[TAG:Dark]` Add theme toggle UI, switch `light/dark` class, persist in `localStorage`. — _Done when:_ Toggle switches theme, persists on refresh.~~
- [x] ~~**P3.6** `[TAG:Dark]` Audit **one chart** (dashboard primary) for dark readability. Fix contrast. — _Done when:_ Chart legible in dark mode.~~
- [x] ~~**P3.7** `[TAG:Dark]` Audit remaining charts + components for dark mode. — _Done when:_ All UI legible in both modes.~~
- [x] ~~**P3.8** `[TAG:Dark]` Sync dark mode preference to `profiles.dark_mode` for authenticated users. — _Done when:_ Preference persists across devices.~~

---

## Phase 4 — Polish + quality

- [x] ~~**P4.1** `[TAG:Toast]` Create `Toast.tsx` component: success/error/warning/info variants, auto-dismiss 4s, stacking. — _Done when:_ Toast renders, auto-dismisses.~~
- [x] ~~**P4.2** `[TAG:Toast]` Create `ConfirmDialog.tsx` component: modal with Cancel (default focus) + Confirm. — _Done when:_ Dialog renders with proper focus.~~
- [x] ~~**P4.3** `[TAG:Toast]` Replace all `alert()` calls with Toast. — _Done when:_ Zero `alert()` in codebase.~~
- [x] ~~**P4.4** `[TAG:Toast]` Replace all `window.confirm()` calls with ConfirmDialog. — _Done when:_ Zero `confirm()` in codebase.~~
- [x] ~~**P4.5** `[TAG:Error]` Add React Error Boundary wrapping route pages. Show "Something went wrong" + retry. — _Done when:_ Thrown error shows boundary UI.~~
- [x] ~~**P4.6** `[TAG:Loading]` Create `Skeleton.tsx` with shimmer animation. — _Done when:_ Skeleton component exists.~~
- [x] ~~**P4.7** `[TAG:Loading]` Add skeleton states to Dashboard, Ma'aser, Recurring pages during data fetch. — _Done when:_ Skeletons shown while loading.~~
- [x] ~~**P4.8** `[TAG:Demo]` Extend `demoStorage.ts` for `categories`, `recurring_templates`. — _Done when:_ Demo mode supports new models.~~
- [x] ~~**P4.9** `[TAG:Demo]` Seed demo mode with sample recurring templates + custom categories. — _Done when:_ Demo shows realistic data.~~
- [x] ~~**P4.10** `[TAG:Test]` Set up Vitest + React Testing Library. Create sample passing test. — _Done when:_ `npm test` passes.~~
- [x] ~~**P4.11** `[TAG:Test]` Write unit tests for `transactionService`, `categoryService`. — _Done when:_ Service CRUD covered.~~
- [x] ~~**P4.12** `[TAG:Test]` Write integration tests: add transaction, search/filter, toggle recurring. — _Done when:_ Key flows covered.~~

---

## Phase X — Deferred

**Not in current scope.** Re-enter when product prioritizes.

- [ ] **PX.1** `[TAG:Deferred]` **Bulk import** (CSV/image/PDF parsing) — **re-entry:** UX for review queue + error budget defined.
- [ ] **PX.2** `[TAG:Deferred]` **Ma'aser cross-currency credit** — **re-entry:** accounting rules signed off.
- [ ] **PX.3** `[TAG:Deferred]` **Settings page consolidation** — **re-entry:** after P1.9, P1.10, P3.5, P3.8 complete.

---

## Definition of done (per task)

- One behavior or slice shipped; no bundled unrelated refactors.
- Supabase tasks include **RLS** verified for family isolation.
- UI tasks include basic mobile check.
- Tags appear in commit/PR description for traceability.

---

## Dependencies

```
Phase 0A (Structure/Router) ─┬─> Phase 0B (Services) ─┬─> Phase 1+
                             └─> Phase 0C (Tailwind) ─┘

Phase 1 ─────────────────────┬─> Phase 2 (Recurring/Copy)
  └── P1.6-P1.10 (Categories)├─> Phase 3 (Month/Dark)
                             └─> Phase 4 (Polish) [P4.8 needs P1.6]

Phase 2, 3, 4 can run in parallel after their dependencies.
```
