import { Transaction, TransactionType } from '../types';

/** Sample rows for first-time demo; dates use the current calendar year. */
export function getDemoSeedTransactions(): Transaction[] {
  const y = new Date().getFullYear();
  const m = (month: number, day: number) =>
    `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return [
    {
      id: 'demo-seed-1',
      date: m(1, 5),
      description: 'Salary',
      amount: 18500,
      category: 'Income',
      type: TransactionType.INCOME,
      currency: 'ILS',
      isRecurring: true,
    },
    {
      id: 'demo-seed-2',
      date: m(1, 8),
      description: 'Grocery shopping',
      amount: 1240,
      category: 'Food',
      type: TransactionType.EXPENSE,
      currency: 'ILS',
    },
    {
      id: 'demo-seed-3',
      date: m(1, 12),
      description: 'Rent',
      amount: 5200,
      category: 'Housing',
      type: TransactionType.EXPENSE,
      currency: 'ILS',
      isRecurring: true,
    },
    {
      id: 'demo-seed-4',
      date: m(1, 18),
      description: 'Consulting (US client)',
      amount: 3200,
      category: 'Business',
      type: TransactionType.INCOME,
      currency: 'USD',
    },
    {
      id: 'demo-seed-5',
      date: m(1, 20),
      description: 'Charity donation',
      amount: 500,
      category: 'Maaser',
      type: TransactionType.EXPENSE,
      currency: 'ILS',
      isMaaserPayment: true,
      isRecurring: true,
    },
    {
      id: 'demo-seed-6',
      date: m(2, 3),
      description: 'Utilities',
      amount: 890,
      category: 'Bills',
      type: TransactionType.EXPENSE,
      currency: 'ILS',
      isRecurring: true,
      recurringRemainingPayments: 3,
    },
    {
      id: 'demo-seed-7',
      date: m(2, 10),
      description: 'Index fund',
      amount: 1500,
      category: 'Investments',
      type: TransactionType.EXPENSE,
      currency: 'USD',
      isInvestment: true,
    },
  ];
}
