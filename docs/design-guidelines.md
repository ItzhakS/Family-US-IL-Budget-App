# Design Guidelines — Cursor Rule

Use these rules when writing UI code for the Family Budget App.
Stack: React 19, TypeScript, Tailwind CSS (local config, `darkMode: 'class'`), Lucide React icons, Recharts, Supabase.

---

## Principles

1. **Clarity over cleverness** — financial data must be instantly readable; never obscure numbers.
2. **Dual-currency first** — always show ILS and USD side by side; never collapse or hide one.
3. **Accessible by default** — WCAG 2.1 AA. No color-only indicators. Always pair color with icon + text label.
4. **Fast scanning** — important numbers (balances, totals, obligations) above the fold.
5. **Forgiving** — destructive actions require confirmation dialogs; auto-save only where safe.
6. **Demo-testable** — every feature must work fully in demo mode (no auth, localStorage only). If a feature cannot degrade gracefully without Supabase, it needs a demo-storage fallback. Never ship a feature that is only testable by authenticated users.

---

## Tailwind Semantic Tokens

Defined in `tailwind.config.ts` → `theme.extend.colors`. Use these tokens instead of raw colors.

| Token | Light | Dark | When to use |
|---|---|---|---|
| `surface` | white | gray-900 | Card/panel bg |
| `surface-secondary` | gray-50 | gray-800 | Page bg, table headers |
| `border` | gray-200 | gray-700 | Borders, dividers |
| `text-primary` | gray-900 | gray-50 | Headings, amounts |
| `text-secondary` | gray-500 | gray-400 | Labels, metadata |
| `primary` | indigo-600 | indigo-400 | CTAs, active tabs, links |
| `primary-hover` | indigo-700 | indigo-300 | Hover states |
| `income` | green-600 | green-400 | Income, positive balance |
| `expense` | red-600 | red-400 | Expense, negative balance |
| `warning` | amber-600 | amber-400 | Warnings, pending |
| `maaser` | pink-600 | pink-400 | Ma'aser elements |
| `ils-accent` | indigo-50 | indigo-900/30 | ILS section tint |
| `usd-accent` | emerald-50 | emerald-900/30 | USD section tint |

Chart palette: `['#0088FE','#00C49F','#FFBB28','#FF8042','#8884d8','#82ca9d','#ffc658','#8dd1e1','#a4de6c','#d0ed57']`

---

## Dark Mode

- Every `bg-*`, `text-*`, `border-*` class MUST have a `dark:` counterpart.
- Key pairings: `bg-white`→`dark:bg-gray-800`, `bg-gray-50`→`dark:bg-gray-800`, `text-gray-900`→`dark:text-gray-50`, `border-gray-200`→`dark:border-gray-600`.
- `ThemeContext` toggles `dark` class on `<html>`. Respect `prefers-color-scheme` on first visit.
- Recharts: read theme from context → set axis ticks, grid lines, tooltip bg, legend text conditionally.
- Smooth toggle: `transition-colors duration-200` on `<body>` only.

---

## Typography

Font: **Inter** via Google Fonts.

| Role | Classes |
|---|---|
| Hero numbers (balances) | `text-2xl font-bold` or `text-3xl font-bold` |
| Page title | `text-xl font-bold` |
| Section header | `text-lg font-semibold` |
| Body / table row | `text-sm font-normal` |
| Amount in table | `text-sm font-semibold` |
| Badge / label | `text-xs font-medium` |

---

## Layout

- Page: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Section spacing: `space-y-6`
- Grid: 1-col mobile → 2-col `md` → ILS|USD side-by-side at `lg`
- Stat cards: `grid grid-cols-2 lg:grid-cols-4 gap-4`
- Header: `sticky top-0 z-30`; filter bar: `sticky top-[header-height] z-20`
- Card padding: `p-4 sm:p-6`; table cells: `px-4 py-3`; form fields: `space-y-4`

---

## Component Classes

Copy these exact class strings when building components.

**Card**
`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6`

**Button — Primary**
`bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-400 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`

**Button — Secondary**
`border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-2.5 px-4 rounded-xl transition-colors`

**Button — Danger**
`bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl`

**Button — Icon** (table actions)
`p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`

**Form Input**
`w-full border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2.5 text-sm`

**Table wrapper**: `overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700`
**Table head**: `bg-gray-50 dark:bg-gray-700/50 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`
**Table body**: `divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800`
**Table row hover**: `hover:bg-gray-50 dark:hover:bg-gray-700/30`

**Modal overlay**: `fixed inset-0 z-50 bg-black/50`
**Modal content**: `bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto`

**Badge base**: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`
- Income: `bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400`
- Expense: `bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400`
- Maaser: `bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400`
- Neutral: `bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`

**Tab bar container**: `bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex flex-wrap gap-1`
**Tab inactive**: `px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:text-gray-900 dark:hover:text-gray-200 transition-colors`
**Tab active**: `px-3 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-700 rounded-lg shadow-sm`

**Toast**: `fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 min-w-[300px]`
- Success: add `border-l-4 border-green-500`
- Error: add `border-l-4 border-red-500`
- Warning: add `border-l-4 border-amber-500`

**Skeleton**: `animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg`

---

## Icons (Lucide React)

Only use `lucide-react`. No other icon libraries.

Sizes: table/badge `w-3.5 h-3.5` · buttons `w-4 h-4` · nav `w-[18px] h-[18px]` · headers `w-5 h-5` · empty states `w-8 h-8` to `w-12 h-12`.

| Action | Icon | Action | Icon |
|---|---|---|---|
| Add | `Plus` | Delete | `Trash2` |
| Edit | `Pencil` | Copy | `Copy` |
| Search | `Search` | Filter | `Filter` |
| Import | `Upload` | Settings | `Settings` |
| Income | `TrendingUp` | Expense | `TrendingDown` |
| Ma'aser | `Heart` | Recurring | `RefreshCw` |
| Dark mode | `Sun` / `Moon` | Currency | `DollarSign` / ₪ |

Rules:
- Nav items: always icon + text label.
- Icon-only buttons: must have `title` and `aria-label`.

---

## Responsive

- Breakpoints: `sm` 640px, `md` 768px, `lg` 1024px.
- Mobile-first. Currency columns stack vertically on mobile, side-by-side at `lg`.
- Tables: `overflow-x-auto` wrapper. Hide low-priority columns on mobile.
- Modals: `max-w-md` centered on desktop; full-width `mx-4` on mobile.
- Touch targets: minimum 44x44px. Table icon buttons: `p-2.5` on mobile.

---

## Accessibility Rules

- All interactive elements: `focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`.
- Modals: trap focus inside; return focus to trigger on close.
- Color is never the sole indicator — pair with icons and text labels.
- Contrast: 4.5:1 normal text, 3:1 large text — check both themes.
- `<th scope="col">`, `<label>` on all inputs, heading hierarchy `h1→h2→h3`.
- Currency amounts: `<span class="sr-only">Israeli Shekels</span>₪1,500`.
- Icon-only buttons: `title` + `aria-label`. Loading: `aria-live="polite"`.
- Delete: confirmation dialog; "Cancel" gets default focus.

---

## Feedback & Loading

- **Toast** for all CRUD results (replace `alert()`): success, error, warning variants.
- **Optimistic updates** for CRUD operations (existing pattern — keep it).
- **Skeleton placeholders** while data loads (match content layout shape).
- **Button submit**: disable + inline spinner.
- **Transitions**: hover `duration-150`, expand/collapse `duration-200`, modal fade+scale.
- **Numbers**: instant update only — never animate financial amounts.

---

## Feature-Specific UX

### Transaction List
- Default scope: current calendar month. Show label: "Showing: {Month YYYY}".
- Search placeholder: `"Search description or category..."`.
- Three distinct empty states: (1) no transactions this month → CTA to add, (2) no filter results → "Clear filters" link, (3) brand new user → welcome + CTA.

### Recurring Templates
- Status badges: **Active** (green), **Paused** (amber), **Completed** (gray, e.g. "12/12 paid").
- Single-purpose controls: toggle active/paused, edit payment cap, and cancel are separate actions.

### Categories
- Create, rename, and archive are separate affordances — one action per control.
- Case-insensitive duplicate prevention per type per family — show inline error immediately.
- Archive (soft delete): category stays on existing transactions, hidden from new transaction dropdown. Show "Archived" section with "Restore" option.

### Demo Mode
- Every feature must be fully testable without authentication using localStorage-backed demo storage.
- When implementing any new feature, also implement the corresponding `demoStorage` fallback — treat it as part of the same task, not a follow-up.
- Demo mode uses seed data from `constants/demoSeedTransactions.ts`. If a new feature needs data (e.g., recurring templates, custom categories), add representative seed entries there.
- Never gate a UI element or flow behind an auth check unless it involves genuinely sensitive account actions (e.g., inviting family members).

### Currency Display
- Always show ₪ or $ prefix with amount. ILS sections use `ils-accent` tint, USD use `usd-accent` tint.
- Side-by-side at `lg`+, stacked on mobile.
