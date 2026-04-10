export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export type Currency = 'ILS' | 'USD';

/** DB: `categories` row; `kind` matches income vs expense picker in the transaction form. */
export interface Category {
  id: string;
  familyId: string;
  name: string;
  kind: TransactionType;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  currency: Currency;

  /** Snapshot when saved: 1 USD = X ILS (nullable for legacy rows or when FX unavailable). */
  exchangeRateUsdToIls?: number | null;
  /** Calendar date for the FX row above (YYYY-MM-DD). */
  fxRateDate?: string | null;

  // Specific Flags
  isMaaserDeductible?: boolean; // Business exp that reduces Ma'aser obligation (Show in Maaser tab only)
  isMaaserPayment?: boolean;    // Payment to charity (Show in Maaser tab)
  isTaxDeductible?: boolean;    // Business exp for Tax filing (Show in Inv/Tax tab only)
  isInvestment?: boolean;       // Investment deposits (Show in Inv/Tax tab)
  isTaxSavings?: boolean;       // Tax savings deposits (Show in Inv/Tax tab)
  isRecurring?: boolean;        // Monthly recurring bills (Show in Recurring tab)
  /** When set, recurring is cancelled (hidden from active recurring list). */
  recurringCancelledAt?: string | null;
  /** Payments remaining for a finite subscription; null = unlimited. */
  recurringRemainingPayments?: number | null;
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategoryTotal {
  name: string;
  value: number;
  color: string;
}

export interface ReceiptData {
  date?: string;
  totalAmount?: number;
  merchant?: string;
  category?: string;
  currency?: Currency;
}

export interface MaaserMonthStats {
  month: string;
  income: number;
  deductions: number; // Expenses that reduce profit
  deductibleTransactions: Transaction[]; // The actual transactions
  netProfit: number;
  obligation: number; // 10% of Net Profit
  paid: number; // Maaser payments made
  monthlyBalance: number; // Obligation - Paid
  runningBalance: number; // Cumulative
}