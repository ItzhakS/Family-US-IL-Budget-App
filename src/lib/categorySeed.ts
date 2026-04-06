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
