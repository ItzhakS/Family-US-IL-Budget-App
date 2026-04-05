import { Currency, Transaction, TransactionType } from '../types';

/** Calendar month scope: `YYYY-MM` in the browser's local calendar, or all months (within the already year-filtered set). */
export type TransactionListMonthScope = 'all' | string;

export interface TransactionListFilterCriteria {
  monthScope: TransactionListMonthScope;
  /** Case-insensitive match on description (P1.2) and category (P1.3). */
  search: string;
  /** Omit or `'all'` to skip type filtering (e.g. Ma'aser lists). */
  typeFilter?: 'all' | TransactionType;
  currencyFilter: 'all' | Currency;
}

/**
 * Transaction `date` is stored as `YYYY-MM-DD`. Month filter uses prefix `YYYY-MM`
 * so it matches the user's local calendar month for that date string (same convention as input).
 */
export function filterTransactionsForList(
  transactions: Transaction[],
  criteria: TransactionListFilterCriteria
): Transaction[] {
  let out = transactions;

  if (criteria.monthScope !== 'all') {
    const prefix = criteria.monthScope;
    out = out.filter((t) => t.date.slice(0, 7) === prefix);
  }

  const q = criteria.search.trim().toLowerCase();
  if (q) {
    out = out.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }

  if (criteria.typeFilter !== undefined && criteria.typeFilter !== 'all') {
    out = out.filter((t) => t.type === criteria.typeFilter);
  }

  if (criteria.currencyFilter !== 'all') {
    out = out.filter((t) => t.currency === criteria.currencyFilter);
  }

  return out;
}

/** Default list month: current calendar month in the browser's local timezone (P1.1). */
export function getLocalYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function buildMonthOptions(selectedYears: number[]): { value: string; label: string }[] {
  const sorted = [...selectedYears].sort((a, b) => b - a);
  const options: { value: string; label: string }[] = [];
  for (const y of sorted) {
    for (let m = 12; m >= 1; m--) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const label = new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      options.push({ value: key, label });
    }
  }
  return options;
}
