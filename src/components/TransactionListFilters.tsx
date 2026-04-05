import type { FC } from 'react';
import { Search } from 'lucide-react';
import { TransactionType, type Currency } from '../types';

export interface TransactionListFiltersProps {
  monthValue: string;
  onMonthChange: (value: string) => void;
  monthOptions: { value: string; label: string }[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  currencyFilter: 'all' | Currency;
  onCurrencyFilterChange: (value: 'all' | Currency) => void;
  /** When true (default), show income/expense type filter (dashboard). */
  showTypeFilter?: boolean;
  typeFilter?: 'all' | TransactionType;
  onTypeFilterChange?: (value: 'all' | TransactionType) => void;
  /** Prefix for element ids (accessibility). */
  idPrefix?: string;
}

export const TransactionListFilters: FC<TransactionListFiltersProps> = ({
  monthValue,
  onMonthChange,
  monthOptions,
  searchQuery,
  onSearchChange,
  currencyFilter,
  onCurrencyFilterChange,
  showTypeFilter = true,
  typeFilter = 'all',
  onTypeFilterChange,
  idPrefix = 'txn-list-',
}) => {
  const monthSelectId = `${idPrefix}month`;
  const searchId = `${idPrefix}search`;
  const typeId = `${idPrefix}type`;
  const currencyId = `${idPrefix}currency`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1 min-w-[10rem]">
        <label htmlFor={monthSelectId} className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Month
        </label>
        <select
          id={monthSelectId}
          value={monthValue}
          onChange={(e) => onMonthChange(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <option value="all">All months</option>
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-[12rem]">
        <label htmlFor={searchId} className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Search
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
            size={20}
            aria-hidden
          />
          <input
            id={searchId}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Description or category…"
            autoComplete="off"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm pl-10 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          />
        </div>
      </div>

      {showTypeFilter && onTypeFilterChange && (
        <div className="flex flex-col gap-1 min-w-[8rem]">
          <label htmlFor={typeId} className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Type
          </label>
          <select
            id={typeId}
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as 'all' | TransactionType)}
            className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <option value="all">All</option>
            <option value={TransactionType.INCOME}>Income</option>
            <option value={TransactionType.EXPENSE}>Expense</option>
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1 min-w-[8rem]">
        <label htmlFor={currencyId} className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Currency
        </label>
        <select
          id={currencyId}
          value={currencyFilter}
          onChange={(e) => onCurrencyFilterChange(e.target.value as 'all' | Currency)}
          className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <option value="all">All</option>
          <option value="ILS">ILS</option>
          <option value="USD">USD</option>
        </select>
      </div>
    </div>
  );
};
