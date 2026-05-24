import { TransactionType } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './constants';

/** Default rows mirrored from `constants.ts` — used for SQL seed and demo bootstrap. */
export function buildDefaultCategorySeeds(): {
  name: string;
  kind: TransactionType;
  sortOrder: number;
}[] {
  const expense = EXPENSE_CATEGORIES.map((name, sortOrder) => ({
    name,
    kind: TransactionType.EXPENSE,
    sortOrder,
  }));
  const income = INCOME_CATEGORIES.map((name, sortOrder) => ({
    name,
    kind: TransactionType.INCOME,
    sortOrder,
  }));
  return [...expense, ...income];
}

/** Extended demo categories with some custom entries to showcase the feature. */
export function buildDemoCategorySeeds(): {
  name: string;
  kind: TransactionType;
  sortOrder: number;
}[] {
  const base = buildDefaultCategorySeeds();
  const extraExpense = [
    { name: 'Entertainment', kind: TransactionType.EXPENSE, sortOrder: base.filter(c => c.kind === TransactionType.EXPENSE).length },
    { name: 'Health', kind: TransactionType.EXPENSE, sortOrder: base.filter(c => c.kind === TransactionType.EXPENSE).length + 1 },
    { name: 'Bills', kind: TransactionType.EXPENSE, sortOrder: base.filter(c => c.kind === TransactionType.EXPENSE).length + 2 },
    { name: 'Subscriptions', kind: TransactionType.EXPENSE, sortOrder: base.filter(c => c.kind === TransactionType.EXPENSE).length + 3 },
    { name: 'Shopping', kind: TransactionType.EXPENSE, sortOrder: base.filter(c => c.kind === TransactionType.EXPENSE).length + 4 },
    { name: 'Travel', kind: TransactionType.EXPENSE, sortOrder: base.filter(c => c.kind === TransactionType.EXPENSE).length + 5 },
  ];
  const extraIncome = [
    { name: 'Business', kind: TransactionType.INCOME, sortOrder: base.filter(c => c.kind === TransactionType.INCOME).length },
    { name: 'Freelance', kind: TransactionType.INCOME, sortOrder: base.filter(c => c.kind === TransactionType.INCOME).length + 1 },
    { name: 'Rental Income', kind: TransactionType.INCOME, sortOrder: base.filter(c => c.kind === TransactionType.INCOME).length + 2 },
  ];
  return [...base, ...extraExpense, ...extraIncome];
}
