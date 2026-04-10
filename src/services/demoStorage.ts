import { Category, Transaction, TransactionType } from '../types';
import { buildDefaultCategorySeeds } from '../lib/categorySeed';

export const DEMO_SESSION_KEY = 'family-budget-demo-session-v1';
export const DEMO_TX_STORAGE_KEY = 'family-budget-demo-v1';
/** Bump when default demo category presets change so new installs pick up updated seeds. */
export const DEMO_CATEGORIES_KEY = 'family-budget-demo-categories-v2';

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

  const t: Transaction = {
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

  if ('recurringCancelledAt' in raw) {
    const v = raw.recurringCancelledAt;
    if (v === null) t.recurringCancelledAt = null;
    else if (typeof v === 'string' && v.trim() !== '') t.recurringCancelledAt = v;
  }
  if ('recurringRemainingPayments' in raw) {
    const v = raw.recurringRemainingPayments;
    if (v === null) t.recurringRemainingPayments = null;
    else if (typeof v === 'number' && !Number.isNaN(v)) t.recurringRemainingPayments = v;
  }

  if ('exchangeRateUsdToIls' in raw) {
    const v = raw.exchangeRateUsdToIls;
    if (v === null) t.exchangeRateUsdToIls = null;
    else if (typeof v === 'number' && !Number.isNaN(v)) t.exchangeRateUsdToIls = v;
  }
  if ('fxRateDate' in raw) {
    const v = raw.fxRateDate;
    if (v === null) t.fxRateDate = null;
    else if (typeof v === 'string') t.fxRateDate = v;
  }

  return t;
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

function newDemoCategoryId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `demo-cat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeCategory(raw: Record<string, unknown>): Category | null {
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string') return null;
  if (!isTransactionType(raw.kind)) return null;
  if (typeof raw.sortOrder !== 'number') return null;
  return {
    id: raw.id,
    familyId: typeof raw.familyId === 'string' ? raw.familyId : 'demo',
    name: raw.name,
    kind: raw.kind,
    sortOrder: raw.sortOrder,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date(0).toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date(0).toISOString(),
  };
}

export function readDemoCategories(): Category[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DEMO_CATEGORIES_KEY);
    if (!raw) return seedDemoCategoriesToStorage();

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return seedDemoCategoriesToStorage();

    const out: Category[] = [];
    for (const item of parsed) {
      if (item && typeof item === 'object') {
        const c = normalizeCategory(item as Record<string, unknown>);
        if (c) out.push(c);
      }
    }
    if (out.length === 0) return seedDemoCategoriesToStorage();
    return out.sort((a, b) =>
      a.kind !== b.kind ? a.kind.localeCompare(b.kind) : a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
    );
  } catch {
    return seedDemoCategoriesToStorage();
  }
}

function seedDemoCategoriesToStorage(): Category[] {
  const now = new Date().toISOString();
  const seeds = buildDefaultCategorySeeds();
  const rows: Category[] = seeds.map((s) => ({
    id: newDemoCategoryId(),
    familyId: 'demo',
    name: s.name,
    kind: s.kind,
    sortOrder: s.sortOrder,
    createdAt: now,
    updatedAt: now,
  }));
  writeDemoCategories(rows);
  return rows;
}

export function writeDemoCategories(categories: Category[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(DEMO_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to persist demo categories', e);
  }
}
