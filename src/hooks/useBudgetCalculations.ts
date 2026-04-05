import { useMemo, useCallback } from 'react';
import { Transaction, TransactionType, Currency } from '../types';
import { ExchangeRate, convertCurrency } from '../services/exchangeRateService';

export interface CurrencyBudgetSummary {
  income: number;
  expense: number;
  balance: number;
}

export interface MonthlyDataPoint {
  name: string;
  income: number;
  expense: number;
  sortKey: string;
}

export interface CategoryDataPoint {
  name: string;
  value: number;
}

export function useBudgetCalculations(
  transactions: Transaction[],
  selectedYears: number[],
  exchangeRate: ExchangeRate | null
) {
  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map((t) => new Date(t.date).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  const yearFilteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const txYear = parseInt(t.date.split('-')[0], 10);
      return selectedYears.includes(txYear);
    });
  }, [transactions, selectedYears]);

  const dashboardTransactions = useMemo(() => {
    return yearFilteredTransactions.filter(
      (t) =>
        !t.isMaaserDeductible &&
        !t.isTaxDeductible &&
        !t.isInvestment &&
        !t.isTaxSavings
    );
  }, [yearFilteredTransactions]);

  const getSummary = useCallback(
    (curr: Currency): CurrencyBudgetSummary => {
      const txs = dashboardTransactions.filter((t) => t.currency === curr);
      const income = txs
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((acc, t) => acc + t.amount, 0);
      const expense = txs
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => acc + t.amount, 0);
      return { income, expense, balance: income - expense };
    },
    [dashboardTransactions]
  );

  const ilsSummary = useMemo(() => getSummary('ILS'), [getSummary]);
  const usdSummary = useMemo(() => getSummary('USD'), [getSummary]);

  const getMonthlyData = useCallback(
    (curr: Currency): MonthlyDataPoint[] => {
      const data: Record<string, MonthlyDataPoint> = {};
      [...selectedYears].sort((a, b) => a - b).forEach((year) => {
        for (let m = 1; m <= 12; m++) {
          const key = `${year}-${String(m).padStart(2, '0')}`;
          const name = new Date(year, m - 1, 1).toLocaleString('default', {
            month: 'short',
            year: selectedYears.length > 1 ? '2-digit' : undefined,
          });
          data[key] = { name, income: 0, expense: 0, sortKey: key };
        }
      });

      dashboardTransactions
        .filter((t) => t.currency === curr)
        .forEach((t) => {
          const key = t.date.substring(0, 7);
          if (data[key]) {
            if (t.type === TransactionType.INCOME) data[key].income += t.amount;
            else data[key].expense += t.amount;
          }
        });

      return Object.values(data).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    },
    [selectedYears, dashboardTransactions]
  );

  const getCategoryData = useCallback(
    (curr: Currency): CategoryDataPoint[] => {
      const categories: Record<string, number> = {};
      dashboardTransactions
        .filter((t) => t.currency === curr && t.type === TransactionType.EXPENSE)
        .forEach((t) => {
          categories[t.category] = (categories[t.category] || 0) + t.amount;
        });
      return Object.entries(categories)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },
    [dashboardTransactions]
  );

  const convertCurrencyValue = useCallback(
    (amount: number, from: Currency, to: Currency): number | null => {
      if (!exchangeRate) return null;
      return convertCurrency(amount, from, to, exchangeRate);
    },
    [exchangeRate]
  );

  return {
    availableYears,
    yearFilteredTransactions,
    dashboardTransactions,
    ilsSummary,
    usdSummary,
    getMonthlyData,
    getCategoryData,
    convertCurrency: convertCurrencyValue,
  };
}
