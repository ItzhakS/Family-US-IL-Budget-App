import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Transaction } from '../types';
import {
  readDemoTransactions,
  writeDemoTransactions,
  isDemoSessionActive,
} from './demoStorage';
import { getDemoSeedTransactions } from '../lib/demoSeedTransactions';

const sortTransactionsByDate = (txs: Transaction[]) =>
  [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

function newDemoId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function mapRowToTransaction(t: Record<string, unknown>): Transaction {
  return {
    id: String(t.id),
    date: String(t.date),
    description: String(t.description),
    amount: Number(t.amount),
    category: String(t.category),
    type: t.type as Transaction['type'],
    currency: t.currency as Transaction['currency'],
    isMaaserDeductible: Boolean(t.is_maaser_deductible),
    isMaaserPayment: Boolean(t.is_maaser_payment),
    isTaxDeductible: Boolean(t.is_tax_deductible),
    isInvestment: Boolean(t.is_investment),
    isTaxSavings: Boolean(t.is_tax_savings),
    isRecurring: Boolean(t.is_recurring),
  };
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
  if (isDemoSessionActive()) {
    const row: Transaction = { ...tx, id: newDemoId() };
    const next = sortTransactionsByDate([row, ...readDemoTransactions()]);
    writeDemoTransactions(next);
    return row;
  }
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const familyId = await getProfileFamilyId();
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionToInsertRow(tx, familyId))
    .select()
    .single();

  if (error) throw error;
  return mapRowToTransaction(data as Record<string, unknown>);
}

export async function update(id: string, tx: Omit<Transaction, 'id'>): Promise<void> {
  if (isDemoSessionActive()) {
    const next = sortTransactionsByDate(
      readDemoTransactions().map((t) => (t.id === id ? { ...tx, id } : t))
    );
    writeDemoTransactions(next);
    return;
  }
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('transactions')
    .update(transactionToUpdateRow(tx))
    .eq('id', id);

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

export async function bulkCreate(items: Omit<Transaction, 'id'>[]): Promise<Transaction[]> {
  if (items.length === 0) return [];

  if (isDemoSessionActive()) {
    const newRows: Transaction[] = items.map((tx) => ({ ...tx, id: newDemoId() }));
    const next = sortTransactionsByDate([...newRows, ...readDemoTransactions()]);
    writeDemoTransactions(next);
    return newRows;
  }
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const familyId = await getProfileFamilyId();
  const { data, error } = await supabase
    .from('transactions')
    .insert(items.map((tx) => transactionToInsertRow(tx, familyId)))
    .select();

  if (error) throw error;
  return (data || []).map((t) => mapRowToTransaction(t as Record<string, unknown>));
}
