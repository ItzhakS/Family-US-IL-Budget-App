import { Category, RecurringTemplate, Transaction, TransactionType } from '../types';
import { buildDemoCategorySeeds } from '../lib/categorySeed';

export const DEMO_SESSION_KEY = 'family-budget-demo-session-v1';
export const DEMO_TX_STORAGE_KEY = 'family-budget-demo-v1';
/** Bump when default demo category presets change so new installs pick up updated seeds. */
export const DEMO_CATEGORIES_KEY = 'family-budget-demo-categories-v2';
export const DEMO_RECURRING_TEMPLATES_KEY = 'family-budget-demo-recurring-templates-v1';

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
    isNonMaaserIncome: Boolean(raw.isNonMaaserIncome),
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
  if ('recurringTemplateId' in raw) {
    const v = raw.recurringTemplateId;
    if (v === null) t.recurringTemplateId = null;
    else if (typeof v === 'string' && v.trim() !== '') t.recurringTemplateId = v;
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
  const seeds = buildDemoCategorySeeds();
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

function normalizeRecurringTemplate(raw: Record<string, unknown>): RecurringTemplate | null {
  if (typeof raw.id !== 'string' || typeof raw.description !== 'string') return null;
  if (typeof raw.amount !== 'number' || Number.isNaN(raw.amount)) return null;
  if (typeof raw.category !== 'string') return null;
  if (!isTransactionType(raw.type)) return null;
  if (raw.currency !== 'ILS' && raw.currency !== 'USD') return null;
  if (typeof raw.startMonth !== 'string' || !/^\d{4}-\d{2}$/.test(raw.startMonth)) return null;

  const dayRaw = typeof raw.dayOfMonth === 'number' && !Number.isNaN(raw.dayOfMonth) ? raw.dayOfMonth : 1;
  const dayOfMonth = Math.min(28, Math.max(1, Math.floor(dayRaw)));

  const remaining =
    raw.remainingPayments === null || raw.remainingPayments === undefined
      ? null
      : typeof raw.remainingPayments === 'number' && !Number.isNaN(raw.remainingPayments)
        ? raw.remainingPayments
        : null;

  const lastGen =
    raw.lastGeneratedMonth === null || raw.lastGeneratedMonth === undefined
      ? null
      : typeof raw.lastGeneratedMonth === 'string' && /^\d{4}-\d{2}$/.test(raw.lastGeneratedMonth)
        ? raw.lastGeneratedMonth
        : null;

  const cancelled =
    raw.cancelledAt === null || raw.cancelledAt === undefined
      ? null
      : typeof raw.cancelledAt === 'string' && raw.cancelledAt.trim() !== ''
        ? raw.cancelledAt
        : null;

  return {
    id: raw.id,
    familyId: typeof raw.familyId === 'string' ? raw.familyId : 'demo',
    description: raw.description,
    amount: raw.amount,
    category: raw.category,
    type: raw.type,
    currency: raw.currency,
    dayOfMonth,
    isMaaserDeductible: Boolean(raw.isMaaserDeductible),
    isMaaserPayment: Boolean(raw.isMaaserPayment),
    isTaxDeductible: Boolean(raw.isTaxDeductible),
    isInvestment: Boolean(raw.isInvestment),
    isTaxSavings: Boolean(raw.isTaxSavings),
    startMonth: raw.startMonth,
    remainingPayments: remaining,
    lastGeneratedMonth: lastGen,
    cancelledAt: cancelled,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date(0).toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date(0).toISOString(),
  };
}

export function readDemoRecurringTemplates(): RecurringTemplate[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DEMO_RECURRING_TEMPLATES_KEY);
    if (!raw) return seedDemoRecurringTemplatesToStorage();

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return seedDemoRecurringTemplatesToStorage();

    const out: RecurringTemplate[] = [];
    for (const item of parsed) {
      if (item && typeof item === 'object') {
        const t = normalizeRecurringTemplate(item as Record<string, unknown>);
        if (t) out.push(t);
      }
    }
    if (out.length === 0) return seedDemoRecurringTemplatesToStorage();
    return out;
  } catch {
    return seedDemoRecurringTemplatesToStorage();
  }
}

function newDemoTemplateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `demo-rt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function seedDemoRecurringTemplatesToStorage(): RecurringTemplate[] {
  const now = new Date().toISOString();
  const y = new Date().getFullYear();
  const startMonth = `${y}-01`;
  const currentMonth = `${y}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const templates: RecurringTemplate[] = [
    {
      id: newDemoTemplateId(),
      familyId: 'demo',
      description: 'Monthly Rent',
      amount: 5200,
      category: 'Housing',
      type: TransactionType.EXPENSE,
      currency: 'ILS',
      dayOfMonth: 1,
      isMaaserDeductible: false,
      isMaaserPayment: false,
      isTaxDeductible: false,
      isInvestment: false,
      isTaxSavings: false,
      startMonth,
      remainingPayments: null,
      lastGeneratedMonth: currentMonth,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newDemoTemplateId(),
      familyId: 'demo',
      description: 'Electricity Bill',
      amount: 450,
      category: 'Bills',
      type: TransactionType.EXPENSE,
      currency: 'ILS',
      dayOfMonth: 15,
      isMaaserDeductible: false,
      isMaaserPayment: false,
      isTaxDeductible: false,
      isInvestment: false,
      isTaxSavings: false,
      startMonth,
      remainingPayments: null,
      lastGeneratedMonth: currentMonth,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newDemoTemplateId(),
      familyId: 'demo',
      description: 'Internet Subscription',
      amount: 120,
      category: 'Bills',
      type: TransactionType.EXPENSE,
      currency: 'ILS',
      dayOfMonth: 5,
      isMaaserDeductible: false,
      isMaaserPayment: false,
      isTaxDeductible: false,
      isInvestment: false,
      isTaxSavings: false,
      startMonth,
      remainingPayments: null,
      lastGeneratedMonth: currentMonth,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newDemoTemplateId(),
      familyId: 'demo',
      description: 'Gym Membership',
      amount: 250,
      category: 'Health',
      type: TransactionType.EXPENSE,
      currency: 'ILS',
      dayOfMonth: 1,
      isMaaserDeductible: false,
      isMaaserPayment: false,
      isTaxDeductible: false,
      isInvestment: false,
      isTaxSavings: false,
      startMonth,
      remainingPayments: 6,
      lastGeneratedMonth: currentMonth,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newDemoTemplateId(),
      familyId: 'demo',
      description: 'Streaming Service (USD)',
      amount: 15,
      category: 'Entertainment',
      type: TransactionType.EXPENSE,
      currency: 'USD',
      dayOfMonth: 10,
      isMaaserDeductible: false,
      isMaaserPayment: false,
      isTaxDeductible: false,
      isInvestment: false,
      isTaxSavings: false,
      startMonth,
      remainingPayments: null,
      lastGeneratedMonth: currentMonth,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newDemoTemplateId(),
      familyId: 'demo',
      description: 'Monthly Charity',
      amount: 500,
      category: 'Maaser',
      type: TransactionType.EXPENSE,
      currency: 'ILS',
      dayOfMonth: 20,
      isMaaserDeductible: false,
      isMaaserPayment: true,
      isTaxDeductible: false,
      isInvestment: false,
      isTaxSavings: false,
      startMonth,
      remainingPayments: null,
      lastGeneratedMonth: currentMonth,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newDemoTemplateId(),
      familyId: 'demo',
      description: 'Index Fund Contribution',
      amount: 500,
      category: 'Investments',
      type: TransactionType.EXPENSE,
      currency: 'USD',
      dayOfMonth: 25,
      isMaaserDeductible: false,
      isMaaserPayment: false,
      isTaxDeductible: false,
      isInvestment: true,
      isTaxSavings: false,
      startMonth,
      remainingPayments: null,
      lastGeneratedMonth: currentMonth,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newDemoTemplateId(),
      familyId: 'demo',
      description: 'Old Phone Plan (Cancelled)',
      amount: 80,
      category: 'Bills',
      type: TransactionType.EXPENSE,
      currency: 'ILS',
      dayOfMonth: 10,
      isMaaserDeductible: false,
      isMaaserPayment: false,
      isTaxDeductible: false,
      isInvestment: false,
      isTaxSavings: false,
      startMonth,
      remainingPayments: null,
      lastGeneratedMonth: `${y}-03`,
      cancelledAt: `${y}-04-01T00:00:00Z`,
      createdAt: now,
      updatedAt: now,
    },
  ];

  writeDemoRecurringTemplates(templates);
  return templates;
}

export function writeDemoRecurringTemplates(templates: RecurringTemplate[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(DEMO_RECURRING_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to persist demo recurring templates', e);
  }
}
