import { Transaction, TransactionType } from '../types';

export const DEMO_SESSION_KEY = 'family-budget-demo-session-v1';
export const DEMO_TX_STORAGE_KEY = 'family-budget-demo-v1';

export function isDemoSessionActive(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(DEMO_SESSION_KEY) === '1';
}

export function setDemoSessionActive(active: boolean): void {
  if (typeof sessionStorage === 'undefined') return;
  if (active) {
    sessionStorage.setItem(DEMO_SESSION_KEY, '1');
  } else {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  }
}

function isTransactionType(v: unknown): v is TransactionType {
  return v === TransactionType.INCOME || v === TransactionType.EXPENSE;
}

function normalizeRawTransaction(raw: Record<string, unknown>): Transaction | null {
  if (typeof raw.id !== 'string' || typeof raw.date !== 'string') return null;
  if (typeof raw.description !== 'string' || typeof raw.amount !== 'number') return null;
  if (typeof raw.category !== 'string' || !isTransactionType(raw.type)) return null;
  if (raw.currency !== 'ILS' && raw.currency !== 'USD') return null;

  return {
    id: raw.id,
    date: raw.date,
    description: raw.description,
    amount: raw.amount,
    category: raw.category,
    type: raw.type,
    currency: raw.currency,
    isMaaserDeductible: Boolean(raw.isMaaserDeductible),
    isMaaserPayment: Boolean(raw.isMaaserPayment),
    isTaxDeductible: Boolean(raw.isTaxDeductible),
    isInvestment: Boolean(raw.isInvestment),
    isTaxSavings: Boolean(raw.isTaxSavings),
    isRecurring: Boolean(raw.isRecurring),
  };
}

export function readDemoTransactions(): Transaction[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(DEMO_TX_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const out: Transaction[] = [];
    for (const item of parsed) {
      if (item && typeof item === 'object') {
        const t = normalizeRawTransaction(item as Record<string, unknown>);
        if (t) out.push(t);
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function writeDemoTransactions(transactions: Transaction[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(DEMO_TX_STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to persist demo transactions', e);
  }
}

/** Clears saved demo transactions (optional reset). Session flag is separate. */
export function clearDemoTransactionStorage(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(DEMO_TX_STORAGE_KEY);
}
