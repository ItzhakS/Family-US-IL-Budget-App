import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { RecurringTemplate, TransactionType } from '../types';
import {
  isDemoSessionActive,
  readDemoRecurringTemplates,
  writeDemoRecurringTemplates,
} from './demoStorage';

function newDemoId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `demo-rt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function clampDayOfMonth(day: number | null | undefined): number {
  if (day == null || Number.isNaN(day)) return 1;
  return Math.min(28, Math.max(1, Math.floor(day)));
}

function mapRowToTemplate(row: Record<string, unknown>): RecurringTemplate {
  const remaining =
    row.remaining_payments === null || row.remaining_payments === undefined
      ? null
      : Number.isNaN(Number(row.remaining_payments))
        ? null
        : Number(row.remaining_payments);

  const lastGen =
    row.last_generated_month === null || row.last_generated_month === undefined
      ? null
      : String(row.last_generated_month).trim() === ''
        ? null
        : String(row.last_generated_month);

  const cancelled =
    row.cancelled_at === null || row.cancelled_at === undefined
      ? null
      : String(row.cancelled_at).trim() === ''
        ? null
        : String(row.cancelled_at);

  return {
    id: String(row.id),
    familyId: String(row.family_id),
    description: String(row.description),
    amount: Number(row.amount),
    category: String(row.category),
    type: row.type as TransactionType,
    currency: row.currency as RecurringTemplate['currency'],
    dayOfMonth: clampDayOfMonth(Number(row.day_of_month)),
    isMaaserDeductible: Boolean(row.is_maaser_deductible),
    isMaaserPayment: Boolean(row.is_maaser_payment),
    isTaxDeductible: Boolean(row.is_tax_deductible),
    isInvestment: Boolean(row.is_investment),
    isTaxSavings: Boolean(row.is_tax_savings),
    startMonth: String(row.start_month),
    remainingPayments: remaining,
    lastGeneratedMonth: lastGen,
    cancelledAt: cancelled,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function templateToInsertRow(
  t: Omit<RecurringTemplate, 'id' | 'familyId' | 'createdAt' | 'updatedAt'>,
  familyId: string
): Record<string, unknown> {
  return {
    family_id: familyId,
    description: t.description,
    amount: t.amount,
    category: t.category,
    type: t.type,
    currency: t.currency,
    day_of_month: clampDayOfMonth(t.dayOfMonth),
    is_maaser_deductible: t.isMaaserDeductible,
    is_maaser_payment: t.isMaaserPayment,
    is_tax_deductible: t.isTaxDeductible,
    is_investment: t.isInvestment,
    is_tax_savings: t.isTaxSavings,
    start_month: t.startMonth,
    remaining_payments: t.remainingPayments,
    last_generated_month: t.lastGeneratedMonth,
    cancelled_at: t.cancelledAt,
  };
}

function templateToUpdateRow(
  t: Partial<Omit<RecurringTemplate, 'id' | 'familyId' | 'createdAt' | 'updatedAt'>>
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (t.description !== undefined) row.description = t.description;
  if (t.amount !== undefined) row.amount = t.amount;
  if (t.category !== undefined) row.category = t.category;
  if (t.type !== undefined) row.type = t.type;
  if (t.currency !== undefined) row.currency = t.currency;
  if (t.dayOfMonth !== undefined) row.day_of_month = clampDayOfMonth(t.dayOfMonth);
  if (t.isMaaserDeductible !== undefined) row.is_maaser_deductible = t.isMaaserDeductible;
  if (t.isMaaserPayment !== undefined) row.is_maaser_payment = t.isMaaserPayment;
  if (t.isTaxDeductible !== undefined) row.is_tax_deductible = t.isTaxDeductible;
  if (t.isInvestment !== undefined) row.is_investment = t.isInvestment;
  if (t.isTaxSavings !== undefined) row.is_tax_savings = t.isTaxSavings;
  if (t.startMonth !== undefined) row.start_month = t.startMonth;
  if ('remainingPayments' in t) row.remaining_payments = t.remainingPayments ?? null;
  if ('lastGeneratedMonth' in t) row.last_generated_month = t.lastGeneratedMonth ?? null;
  if ('cancelledAt' in t) row.cancelled_at = t.cancelledAt ?? null;
  row.updated_at = new Date().toISOString();
  return row;
}

async function getProfileFamilyId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();
  if (error || !profile) throw new Error('Could not fetch user profile');
  return profile.family_id as string;
}

export async function getAll(): Promise<RecurringTemplate[]> {
  if (isDemoSessionActive()) {
    return readDemoRecurringTemplates();
  }
  if (!isSupabaseConfigured) return [];

  const familyId = await getProfileFamilyId();
  const { data, error } = await supabase
    .from('recurring_templates')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      console.warn('recurring_templates table not present yet; returning empty list.');
      return [];
    }
    throw error;
  }
  return (data || []).map((row) => mapRowToTemplate(row as Record<string, unknown>));
}

export async function create(
  input: Omit<RecurringTemplate, 'id' | 'familyId' | 'createdAt' | 'updatedAt'>
): Promise<RecurringTemplate> {
  if (isDemoSessionActive()) {
    const now = new Date().toISOString();
    const template: RecurringTemplate = {
      ...input,
      dayOfMonth: clampDayOfMonth(input.dayOfMonth),
      id: newDemoId(),
      familyId: 'demo',
      createdAt: now,
      updatedAt: now,
    };
    const next = [...readDemoRecurringTemplates(), template];
    writeDemoRecurringTemplates(next);
    return template;
  }
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const familyId = await getProfileFamilyId();
  const row = templateToInsertRow(input, familyId);
  const { data, error } = await supabase
    .from('recurring_templates')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapRowToTemplate(data as Record<string, unknown>);
}

export async function update(
  id: string,
  patch: Partial<Omit<RecurringTemplate, 'id' | 'familyId' | 'createdAt' | 'updatedAt'>>
): Promise<RecurringTemplate> {
  if (isDemoSessionActive()) {
    const all = readDemoRecurringTemplates();
    const existing = all.find((t) => t.id === id);
    if (!existing) throw new Error('Recurring template not found');
    const merged: RecurringTemplate = {
      ...existing,
      ...patch,
      dayOfMonth: clampDayOfMonth(patch.dayOfMonth ?? existing.dayOfMonth),
      updatedAt: new Date().toISOString(),
    };
    writeDemoRecurringTemplates(all.map((t) => (t.id === id ? merged : t)));
    return merged;
  }
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const row = templateToUpdateRow(patch);
  const { data, error } = await supabase
    .from('recurring_templates')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapRowToTemplate(data as Record<string, unknown>);
}

export async function cancel(id: string): Promise<RecurringTemplate> {
  return update(id, { cancelledAt: new Date().toISOString() });
}

export async function deleteTemplate(id: string): Promise<void> {
  if (isDemoSessionActive()) {
    writeDemoRecurringTemplates(
      readDemoRecurringTemplates().filter((t) => t.id !== id)
    );
    return;
  }
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('recurring_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: unknown }).code;
  // Postgres "relation does not exist" or PostgREST unknown schema cache.
  return code === '42P01' || code === 'PGRST205';
}
