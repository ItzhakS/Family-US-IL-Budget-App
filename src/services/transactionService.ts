import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Transaction } from '../types';
import {
  readDemoTransactions,
  writeDemoTransactions,
  isDemoSessionActive,
} from './demoStorage';
import { getDemoSeedTransactions } from '../lib/demoSeedTransactions';
import { getExchangeRate, getExchangeRateOffline } from './exchangeRateService';

const sortTransactionsByDate = (txs: Transaction[]) =>
  [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const ADDITIVE_TRANSACTION_COLUMNS = [
  'is_tax_savings',
  'exchange_rate_usd_to_ils',
  'fx_rate_date',
  'recurring_cancelled_at',
  'recurring_remaining_payments',
  'recurring_template_id',
] as const;

function isMissingSchemaColumnError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: unknown }).code === 'PGRST204'
  );
}

function omitNullishAdditiveColumns(row: Record<string, unknown>): Record<string, unknown> {
  const next = { ...row };
  for (const column of ADDITIVE_TRANSACTION_COLUMNS) {
    if (next[column] === null || next[column] === undefined) {
      delete next[column];
    }
  }
  return next;
}

function omitAdditiveColumns(row: Record<string, unknown>): Record<string, unknown> {
  const next = { ...row };
  for (const column of ADDITIVE_TRANSACTION_COLUMNS) {
    delete next[column];
  }
  return next;
}

function prepareTransactionRow(row: Record<string, unknown>): Record<string, unknown> {
  return omitNullishAdditiveColumns(row);
}

function newDemoId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** FX source for persisting: demo / offline uses session cache + API; signed-in uses DB-backed global rate. */
async function snapshotFxForPersist(): Promise<{
  exchangeRateUsdToIls: number | null;
  fxRateDate: string | null;
}> {
  const rate =
    isDemoSessionActive() || !isSupabaseConfigured
      ? await getExchangeRateOffline()
      : await getExchangeRate();
  if (!rate) return { exchangeRateUsdToIls: null, fxRateDate: null };
  return { exchangeRateUsdToIls: rate.usdToIls, fxRateDate: rate.date };
}

function amountOrCurrencyChanged(a: Transaction, b: Omit<Transaction, 'id'>): boolean {
  return a.amount !== b.amount || a.currency !== b.currency;
}

function mergeTxForUpdate(
  existing: Transaction,
  patch: Omit<Transaction, 'id'>,
  fx: { exchangeRateUsdToIls: number | null; fxRateDate: string | null } | null,
  refreshFx: boolean
): Omit<Transaction, 'id'> {
  // Preserve recurring_template_id link unless the patch explicitly carries it.
  // The form does not surface this field, so editing a generated row must not orphan it.
  const preservedTemplateId =
    patch.recurringTemplateId !== undefined
      ? patch.recurringTemplateId
      : (existing.recurringTemplateId ?? null);

  if (refreshFx) {
    return {
      ...patch,
      exchangeRateUsdToIls: fx?.exchangeRateUsdToIls ?? null,
      fxRateDate: fx?.fxRateDate ?? null,
      recurringTemplateId: preservedTemplateId,
    };
  }
  return {
    ...patch,
    exchangeRateUsdToIls: existing.exchangeRateUsdToIls ?? null,
    fxRateDate: existing.fxRateDate ?? null,
    recurringTemplateId: preservedTemplateId,
  };
}

export function mapRowToTransaction(t: Record<string, unknown>): Transaction {
  const ex = t.exchange_rate_usd_to_ils;
  const fxDate = t.fx_rate_date;

  let exchangeRateUsdToIls: number | null = null;
  if (ex !== null && ex !== undefined && String(ex).trim() !== '') {
    const n = Number(ex);
    exchangeRateUsdToIls = Number.isNaN(n) ? null : n;
  }

  return {
    id: String(t.id),
    date: String(t.date),
    description: String(t.description),
    amount: Number(t.amount),
    category: String(t.category),
    type: t.type as Transaction['type'],
    currency: t.currency as Transaction['currency'],
    exchangeRateUsdToIls,
    fxRateDate:
      fxDate !== null && fxDate !== undefined && String(fxDate).trim() !== ''
        ? String(fxDate).slice(0, 10)
        : null,
    isMaaserDeductible: Boolean(t.is_maaser_deductible),
    isMaaserPayment: Boolean(t.is_maaser_payment),
    isTaxDeductible: Boolean(t.is_tax_deductible),
    isInvestment: Boolean(t.is_investment),
    isTaxSavings: Boolean(t.is_tax_savings),
    isRecurring: Boolean(t.is_recurring),
    recurringCancelledAt: parseOptionalIso(t.recurring_cancelled_at),
    recurringRemainingPayments: parseOptionalInt(t.recurring_remaining_payments),
    recurringTemplateId: parseOptionalString(t.recurring_template_id),
  };
}

function parseOptionalString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function parseOptionalIso(v: unknown): string | null {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  return String(v);
}

function parseOptionalInt(v: unknown): number | null {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function transactionToInsertRow(
  tx: Omit<Transaction, 'id'>,
  familyId: string
): Record<string, unknown> {
  return {
    date: tx.date,
    description: tx.description,
    amount: tx.amount,
    category: tx.category,
    type: tx.type,
    currency: tx.currency,
    is_recurring: tx.isRecurring ?? false,
    is_maaser_deductible: tx.isMaaserDeductible ?? false,
    is_maaser_payment: tx.isMaaserPayment ?? false,
    is_tax_deductible: tx.isTaxDeductible ?? false,
    is_investment: tx.isInvestment ?? false,
    is_tax_savings: tx.isTaxSavings ?? false,
    exchange_rate_usd_to_ils: tx.exchangeRateUsdToIls ?? null,
    fx_rate_date: tx.fxRateDate ?? null,
    recurring_cancelled_at: tx.recurringCancelledAt ?? null,
    recurring_remaining_payments: tx.recurringRemainingPayments ?? null,
    recurring_template_id: tx.recurringTemplateId ?? null,
    family_id: familyId,
  };
}

function transactionToUpdateRow(tx: Omit<Transaction, 'id'>): Record<string, unknown> {
  return {
    date: tx.date,
    description: tx.description,
    amount: tx.amount,
    category: tx.category,
    type: tx.type,
    currency: tx.currency,
    is_recurring: tx.isRecurring ?? false,
    is_maaser_deductible: tx.isMaaserDeductible ?? false,
    is_maaser_payment: tx.isMaaserPayment ?? false,
    is_tax_deductible: tx.isTaxDeductible ?? false,
    is_investment: tx.isInvestment ?? false,
    is_tax_savings: tx.isTaxSavings ?? false,
    exchange_rate_usd_to_ils: tx.exchangeRateUsdToIls ?? null,
    fx_rate_date: tx.fxRateDate ?? null,
    recurring_cancelled_at: tx.recurringCancelledAt ?? null,
    recurring_remaining_payments: tx.recurringRemainingPayments ?? null,
    recurring_template_id: tx.recurringTemplateId ?? null,
  };
}

async function getProfileFamilyId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();
  if (error || !profile) throw new Error('Could not fetch user profile');
  return profile.family_id as string;
}

export async function getAll(): Promise<Transaction[]> {
  if (isDemoSessionActive()) {
    let txs = readDemoTransactions();
    if (txs.length === 0) {
      txs = getDemoSeedTransactions();
      writeDemoTransactions(txs);
    }
    return sortTransactionsByDate(txs);
  }
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return (data || []).map((t) => mapRowToTransaction(t as Record<string, unknown>));
}

export async function create(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
  const fx = await snapshotFxForPersist();
  const withFx: Omit<Transaction, 'id'> = {
    ...tx,
    exchangeRateUsdToIls: fx.exchangeRateUsdToIls,
    fxRateDate: fx.fxRateDate,
  };

  if (isDemoSessionActive()) {
    const row: Transaction = { ...withFx, id: newDemoId() };
    const next = sortTransactionsByDate([row, ...readDemoTransactions()]);
    writeDemoTransactions(next);
    return row;
  }
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const familyId = await getProfileFamilyId();
  const row = transactionToInsertRow(withFx, familyId);
  let { data, error } = await supabase
    .from('transactions')
    .insert(prepareTransactionRow(row))
    .select()
    .single();

  if (isMissingSchemaColumnError(error)) {
    console.warn('Retrying transaction insert without additive columns after schema-cache miss.');
    const retry = await supabase
      .from('transactions')
      .insert(omitAdditiveColumns(row))
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  return mapRowToTransaction(data as Record<string, unknown>);
}

export async function update(id: string, tx: Omit<Transaction, 'id'>): Promise<void> {
  if (isDemoSessionActive()) {
    const all = readDemoTransactions();
    const existing = all.find((t) => t.id === id);
    if (!existing) throw new Error('Transaction not found');

    const refreshFx = amountOrCurrencyChanged(existing, tx);
    const fx = refreshFx ? await snapshotFxForPersist() : null;
    const merged = mergeTxForUpdate(existing, tx, fx, refreshFx);
    const next = sortTransactionsByDate(
      all.map((t) => (t.id === id ? { ...merged, id } : t))
    );
    writeDemoTransactions(next);
    return;
  }
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const { data: existingRow, error: fetchErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !existingRow) throw new Error('Transaction not found');
  const existing = mapRowToTransaction(existingRow as Record<string, unknown>);
  const refreshFx = amountOrCurrencyChanged(existing, tx);
  const fx = refreshFx ? await snapshotFxForPersist() : null;
  const merged = mergeTxForUpdate(existing, tx, fx, refreshFx);

  const row = transactionToUpdateRow(merged);
  let { error } = await supabase
    .from('transactions')
    .update(prepareTransactionRow(row))
    .eq('id', id);

  if (isMissingSchemaColumnError(error)) {
    console.warn('Retrying transaction update without additive columns after schema-cache miss.');
    const retry = await supabase
      .from('transactions')
      .update(omitAdditiveColumns(row))
      .eq('id', id);
    error = retry.error;
  }

  if (error) throw error;
}

export async function deleteTransaction(id: string): Promise<void> {
  if (isDemoSessionActive()) {
    writeDemoTransactions(readDemoTransactions().filter((t) => t.id !== id));
    return;
  }
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Link a set of existing transaction rows to a recurring template (legacy migration helper).
 * Skips rows that are already linked to a different template.
 */
export async function linkToRecurringTemplate(
  transactionIds: string[],
  templateId: string
): Promise<void> {
  if (transactionIds.length === 0) return;

  if (isDemoSessionActive()) {
    const all = readDemoTransactions();
    const idSet = new Set(transactionIds);
    const next = all.map((t) => {
      if (!idSet.has(t.id)) return t;
      if (t.recurringTemplateId && t.recurringTemplateId !== templateId) return t;
      return { ...t, recurringTemplateId: templateId };
    });
    writeDemoTransactions(next);
    return;
  }
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  let { error } = await supabase
    .from('transactions')
    .update({ recurring_template_id: templateId })
    .in('id', transactionIds)
    .is('recurring_template_id', null);

  if (isMissingSchemaColumnError(error)) {
    console.warn('Skipping linkToRecurringTemplate: recurring_template_id column not present in cache.');
    return;
  }
  if (error) throw error;
}

export async function bulkCreate(items: Omit<Transaction, 'id'>[]): Promise<Transaction[]> {
  if (items.length === 0) return [];

  const fx = await snapshotFxForPersist();
  const withFx = items.map((tx) => ({
    ...tx,
    exchangeRateUsdToIls: fx.exchangeRateUsdToIls,
    fxRateDate: fx.fxRateDate,
  }));

  if (isDemoSessionActive()) {
    const newRows: Transaction[] = withFx.map((tx) => ({ ...tx, id: newDemoId() }));
    const next = sortTransactionsByDate([...newRows, ...readDemoTransactions()]);
    writeDemoTransactions(next);
    return newRows;
  }
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const familyId = await getProfileFamilyId();
  const rows = withFx.map((tx) => transactionToInsertRow(tx, familyId));
  let { data, error } = await supabase
    .from('transactions')
    .insert(rows.map(prepareTransactionRow))
    .select();

  if (isMissingSchemaColumnError(error)) {
    console.warn('Retrying bulk transaction insert without additive columns after schema-cache miss.');
    const retry = await supabase
      .from('transactions')
      .insert(rows.map(omitAdditiveColumns))
      .select();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  return (data || []).map((t) => mapRowToTransaction(t as Record<string, unknown>));
}
