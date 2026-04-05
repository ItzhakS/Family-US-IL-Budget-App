import { useState, useMemo, useEffect, useCallback } from 'react';
import { Transaction, TransactionType, Currency } from '../types';
import {
  filterTransactionsForList,
  getLocalYearMonth,
  buildMonthOptions,
} from '../lib/transactionListFilters';

export interface UseTransactionListFilterOptions {
  /** When false, income/expense type is not filtered or shown (e.g. Ma'aser transaction lists). Default true. */
  includeTypeFilter?: boolean;
  /** Prefix for input ids (a11y). E.g. `maaser-list-`. */
  idPrefix?: string;
}

/**
 * Shared month / search / type / currency filters for transaction lists (Dashboard, Ma'aser, etc.).
 * Default month is the current calendar month in the browser local timezone.
 */
export function useTransactionListFilterState(
  yearFilteredTransactions: Transaction[],
  selectedYears: number[],
  options: UseTransactionListFilterOptions = {}
) {
  const includeTypeFilter = options.includeTypeFilter !== false;
  const idPrefix = options.idPrefix ?? 'txn-list-';

  const [listMonthScope, setListMonthScope] = useState<string>(() => getLocalYearMonth());
  const [listSearch, setListSearch] = useState('');
  const [listTypeFilter, setListTypeFilter] = useState<'all' | TransactionType>('all');
  const [listCurrencyFilter, setListCurrencyFilter] = useState<'all' | Currency>('all');

  const monthOptions = useMemo(() => buildMonthOptions(selectedYears), [selectedYears]);

  useEffect(() => {
    if (listMonthScope === 'all') return;
    const y = parseInt(listMonthScope.slice(0, 4), 10);
    if (Number.isNaN(y) || !selectedYears.includes(y)) {
      setListMonthScope('all');
      return;
    }
    if (!monthOptions.some((o) => o.value === listMonthScope)) {
      setListMonthScope('all');
    }
  }, [selectedYears, listMonthScope, monthOptions]);

  const applyListFilters = useCallback(
    (transactions: Transaction[]) =>
      filterTransactionsForList(transactions, {
        monthScope: listMonthScope,
        search: listSearch,
        typeFilter: includeTypeFilter ? listTypeFilter : undefined,
        currencyFilter: listCurrencyFilter,
      }),
    [listMonthScope, listSearch, listTypeFilter, listCurrencyFilter, includeTypeFilter]
  );

  const listDisplayTransactions = useMemo(
    () => applyListFilters(yearFilteredTransactions),
    [applyListFilters, yearFilteredTransactions]
  );

  const listEmptyMessage = useMemo(() => {
    if (listDisplayTransactions.length > 0) return undefined;
    if (yearFilteredTransactions.length === 0) {
      return {
        title: 'No transactions in selected years',
        subtitle: 'Adjust the year filter above or add a transaction.',
      };
    }
    return {
      title: 'No matching transactions',
      subtitle: includeTypeFilter
        ? 'Try All months, clearing search, or setting type and currency to All.'
        : 'Try All months, clearing search, or setting currency to All.',
    };
  }, [
    listDisplayTransactions.length,
    yearFilteredTransactions.length,
    includeTypeFilter,
  ]);

  const transactionListFilterProps = useMemo(
    () => ({
      showTypeFilter: includeTypeFilter,
      idPrefix,
      monthValue: listMonthScope,
      onMonthChange: setListMonthScope,
      monthOptions,
      searchQuery: listSearch,
      onSearchChange: setListSearch,
      typeFilter: listTypeFilter,
      onTypeFilterChange: setListTypeFilter,
      currencyFilter: listCurrencyFilter,
      onCurrencyFilterChange: setListCurrencyFilter,
    }),
    [
      includeTypeFilter,
      listMonthScope,
      monthOptions,
      listSearch,
      listTypeFilter,
      listCurrencyFilter,
      idPrefix,
    ]
  );

  return {
    listMonthScope,
    setListMonthScope,
    listSearch,
    setListSearch,
    listTypeFilter,
    setListTypeFilter,
    listCurrencyFilter,
    setListCurrencyFilter,
    monthOptions,
    applyListFilters,
    listDisplayTransactions,
    listEmptyMessage,
    transactionListFilterProps,
  };
}
