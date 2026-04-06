import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Category, TransactionType } from '../types';
import {
  isDemoSessionActive,
  readDemoCategories,
  writeDemoCategories,
} from './demoStorage';

function mapRowToCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    familyId: String(row.family_id),
    name: String(row.name),
    kind: row.kind as TransactionType,
    sortOrder: Number(row.sort_order),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
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

function nextSortOrder(categories: Category[], kind: TransactionType): number {
  const same = categories.filter((c) => c.kind === kind);
  if (same.length === 0) return 0;
  return Math.max(...same.map((c) => c.sortOrder)) + 1;
}

function newDemoId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `demo-cat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function getAll(): Promise<Category[]> {
  if (isDemoSessionActive()) {
    return readDemoCategories();
  }
  if (!isSupabaseConfigured) return [];

  const familyId = await getProfileFamilyId();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('family_id', familyId)
    .order('kind', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []).map((row) => mapRowToCategory(row as Record<string, unknown>));
}

export async function createCategory(
  name: string,
  kind: TransactionType
): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category name required');

  if (isDemoSessionActive()) {
    const all = readDemoCategories();
    const sortOrder = nextSortOrder(all, kind);
    const now = new Date().toISOString();
    const row: Category = {
      id: newDemoId(),
      familyId: 'demo',
      name: trimmed,
      kind,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    };
    if (all.some((c) => c.kind === kind && c.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('A category with this name already exists for this type.');
    }
    writeDemoCategories([...all, row]);
    return row;
  }
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const familyId = await getProfileFamilyId();
  const existing = await getAll();
  const sortOrder = nextSortOrder(existing, kind);

  const { data, error } = await supabase
    .from('categories')
    .insert({
      family_id: familyId,
      name: trimmed,
      kind,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRowToCategory(data as Record<string, unknown>);
}

/**
 * P1.10: Rename updates the `categories` row only.
 * Policy: existing `transactions.category` strings are not rewritten — historical rows keep the label they were saved
 * with until the user edits each transaction (or changes category in bulk in a future feature).
 */
export async function renameCategory(id: string, newName: string): Promise<Category> {
  const trimmed = newName.trim();
  if (!trimmed) throw new Error('Category name required');

  if (isDemoSessionActive()) {
    const all = readDemoCategories();
    const row = all.find((c) => c.id === id);
    if (!row) throw new Error('Category not found');
    if (all.some((c) => c.id !== id && c.kind === row.kind && c.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('A category with this name already exists for this type.');
    }
    const now = new Date().toISOString();
    const next = all.map((c) =>
      c.id === id ? { ...c, name: trimmed, updatedAt: now } : c
    );
    writeDemoCategories(next);
    return next.find((c) => c.id === id)!;
  }
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const familyId = await getProfileFamilyId();
  const { data: existing, error: fetchErr } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .eq('family_id', familyId)
    .single();

  if (fetchErr || !existing) throw new Error('Category not found');

  const kind = existing.kind as TransactionType;
  const { data: conflict } = await supabase
    .from('categories')
    .select('id')
    .eq('family_id', familyId)
    .eq('kind', kind)
    .eq('name', trimmed)
    .neq('id', id)
    .maybeSingle();

  if (conflict) throw new Error('A category with this name already exists for this type.');

  const { data, error } = await supabase
    .from('categories')
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('family_id', familyId)
    .select()
    .single();

  if (error) throw error;
  return mapRowToCategory(data as Record<string, unknown>);
}

/**
 * Removes the category row only. Past `transactions.category` strings are unchanged (orphan labels until edited).
 */
export async function deleteCategory(id: string): Promise<void> {
  if (isDemoSessionActive()) {
    const all = readDemoCategories();
    if (!all.some((c) => c.id === id)) throw new Error('Category not found');
    writeDemoCategories(all.filter((c) => c.id !== id));
    return;
  }
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const familyId = await getProfileFamilyId();
  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('family_id', familyId)
    .select('id');

  if (error) throw error;
  if (!data?.length) throw new Error('Category not found');
}
