# Masterplan

## Vision

Transform a single-family Israeli-American budget tracker into a **multi-family SaaS** for Jewish families managing finances across Israeli Shekels (ILS) and US Dollars (USD), with built-in Ma'aser (tithe) tracking, AI-powered receipt and statement parsing, and collaborative family budgeting.

## Product

A dual-currency family budget app that understands the unique financial needs of religious Jewish families — tracking income, expenses, Ma'aser obligations, recurring bills, investments, and tax deductions — all shared across family members in real time.

## Users

Jewish families in Israel and the US who:
- Earn and spend in both ILS and USD
- Track Ma'aser (10% charitable giving) obligations based on net business profit
- Manage shared household budgets across multiple family members
- Need visibility into recurring monthly bills, investments, and tax-deductible expenses

## Core Jobs

1. **Track income and expenses** across ILS and USD with historically accurate exchange rates stored per transaction
2. **Calculate Ma'aser obligations** — 10% of net profit (income minus business deductions), with cross-currency credit (ILS surplus reduces USD balance and vice versa)
3. **Manage recurring bills** — toggle on/off, set finite payment counts (e.g., 12 months), auto-populate when a new month is activated
4. **Import transactions in bulk** — parse CSV/Excel files, photos/screenshots of statements, and PDF bank statements using AI (Google Gemini)
5. **Share budgets across family members** — invite spouse/family, all data scoped by family with row-level security
6. **Customize per family** — dynamic income/expense categories (create, rename, reorder) instead of hardcoded lists
7. **Search and filter transactions** — default view is current month, with search by description and filters by category, type, date range, and currency (see [design-guidelines.md](design-guidelines.md#transaction-list-ux) for UX rules)
8. **AI-powered insights** — receipt scanning, financial analysis, smart categorization of imported transactions

Each core job maps to one or more epics in [tasks.md](tasks.md).

## Current State

> For the full decomposition plan of each area below, see [implementation-plan.md](implementation-plan.md).

| Area | Status |
|------|--------|
| Architecture | Monolithic `App.tsx` (1,059 lines) handling auth, routing, state, data fetching, and all tab rendering |
| Routing | No router — tab switching via `activeTab` state variable |
| Categories | Hardcoded in `constants.ts` with personal names (e.g., "Yitzchak 1", "Kollel") |
| Styling | Tailwind CSS via CDN `<script>` tag — no config file, no design tokens, no dark mode |
| Recurring | Simple boolean flag on transactions — no scheduling, no auto-generation, no toggle |
| Exchange rates | Cached daily in Supabase, but NOT stored per transaction |
| Bulk import | None — only individual transaction entry and single-receipt AI scanning |
| Search/filter | None on transaction lists — year-level filtering only |
| Tests | None |
| Dark mode | None |

## Target Architecture (High Level)

- **React 19 + Vite + React Router** — proper page-based routing, decomposed App.tsx into pages and feature components
- **Tailwind CSS** with local config, design tokens, semantic colors, and `class`-based dark mode (see [design-guidelines.md](design-guidelines.md) for full color system and component patterns)
- **Service layer** abstracting all Supabase calls (repository pattern) — `transactionService`, `categoryService`, `recurringService`, `importService` (see [implementation-plan.md](implementation-plan.md) for service API design)
- **Per-family dynamic categories** stored in `family_categories` Supabase table
- **Recurring templates** as a first-class entity with schedule metadata, auto-generation, and finite payment support
- **Exchange rate snapshot** stored on each transaction at creation time
- **Bulk import pipeline** — CSV parser (PapaParse) + Gemini AI for images/PDFs
- **AuthContext + ThemeContext** for authentication and dark mode state

For the full technical architecture, data model changes, and migration strategy, see [implementation-plan.md](implementation-plan.md). For step-by-step execution, see [tasks.md](tasks.md).

## Non-Goals

- **Not a native mobile app** — responsive web is sufficient
- **Not multi-language** — English only (with Hebrew terms like Ma'aser used as-is)
- **Not a billing/subscription platform** — no paid tiers initially
- **Not an onboarding wizard** — categories and settings are made dynamic, but no multi-step signup flow
- **Not a component library adoption** — stay with Tailwind utility classes, no MUI/Chakra/shadcn
- **Not server-side rendered** — client-side SPA is fine for this use case
- **Not a document storage system** — imported receipts/statements are parsed, not stored

## Constraints

- **Supabase** remains the backend (PostgreSQL + Auth + RLS) — no migration to another BaaS
- **Vercel** remains the deployment platform (serverless functions, cron jobs)
- **React hooks and context only** — no Redux, Zustand, or external state management
- **Gemini API budget** — rate limits and cost awareness for AI features (receipt parsing, statement parsing)
- **Open Exchange Rates API** — free tier limits on currency conversion
- **Zero data loss** — all migrations must be additive (no column drops), existing user data preserved
- **Demo mode preserved** — localStorage-based demo mode must work for all new features
- **Supabase free tier** — keep-alive cron must remain to prevent auto-pause after 7 days inactivity

## Success Metrics

- `App.tsx` reduced from 1,059 lines to under 100 (thin shell with router + providers)
- Zero hardcoded family-specific data (categories, income source names)
- All existing features working identically after migration
- Dark mode toggleable with persisted preference
- Transaction list searchable and filterable with current-month default
- Recurring bills auto-populate on month activation
- Bulk import working for CSV, images, and PDF statements
- Ma'aser cross-currency credit operational
- Demo mode exercises all new features without Supabase

## Related Documents

- **[implementation-plan.md](implementation-plan.md)** — Technical architecture, data model changes, migration strategy, service layer design, and feature-level specifications
- **[design-guidelines.md](design-guidelines.md)** — UI/UX principles, color system, component patterns, dark mode strategy, responsive design, and accessibility rules
- **[tasks.md](tasks.md)** — Step-by-step execution plan organized as Epics and User Stories across 5 phases with dependency graph
