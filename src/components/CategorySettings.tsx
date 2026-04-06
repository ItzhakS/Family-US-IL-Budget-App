import { useState } from 'react';
import { Pencil, Plus, Loader2, Trash2 } from 'lucide-react';
import { TransactionType } from '../types';
import { useCategories } from '../contexts/CategoriesContext';
import * as categoryService from '../services/categoryService';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

function KindSection({
  kind,
  title,
  hint,
}: {
  kind: TransactionType;
  title: string;
  hint: string;
}) {
  const { categories, loading, refresh } = useCategories();
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const rows = categories
    .filter((c) => c.kind === kind)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditDraft(name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await categoryService.renameCategory(editingId, editDraft);
      await refresh();
      cancelEdit();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not rename category');
    } finally {
      setSaving(false);
    }
  };

  const add = async () => {
    setSaving(true);
    try {
      await categoryService.createCategory(newName, kind);
      setNewName('');
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not add category');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, name: string) => {
    const ok = window.confirm(
      `Delete "${name}"? Past transactions that used this label will still show it until you edit them.`
    );
    if (!ok) return;
    setSaving(true);
    try {
      await categoryService.deleteCategory(id);
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not delete category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-text-primary dark:text-gray-50">{title}</h3>
      <p className="mt-1 text-sm text-text-secondary dark:text-gray-400">{hint}</p>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary dark:text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading categories…
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border dark:divide-gray-700">
          {rows.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 py-3 first:pt-0">
              {editingId === c.id ? (
                <>
                  <input
                    type="text"
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    className="min-w-[12rem] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    disabled={saving}
                    aria-label={`Rename ${c.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => void saveEdit()}
                    disabled={saving}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={saving}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-secondary dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 text-sm font-medium text-text-primary dark:text-gray-100">
                    {c.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(c.id, c.name)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-text-primary hover:bg-surface-secondary dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <Pencil size={14} aria-hidden />
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(c.id, c.name)}
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-expense hover:bg-red-50 dark:border-gray-600 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <Trash2 size={14} aria-hidden />
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 dark:border-gray-700 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor={`new-cat-${kind}`} className="sr-only">
            New {title.toLowerCase()} name
          </label>
          <input
            id={`new-cat-${kind}`}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`Add ${kind === TransactionType.EXPENSE ? 'expense' : 'income'} category…`}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            disabled={saving}
          />
        </div>
        <button
          type="button"
          onClick={() => void add()}
          disabled={saving || !newName.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={18} />}
          Add
        </button>
      </div>
    </div>
  );
}

export const CategorySettings: React.FC = () => {
  const { isDemoMode } = useAuth();
  const cloud = isSupabaseConfigured && !isDemoMode;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary dark:text-gray-50">Categories</h2>
        <p className="mt-2 text-sm text-text-secondary dark:text-gray-400">
          Names you use in the transaction form. Renaming or deleting only changes this list—the text stored on
          older transactions stays the same until you edit each transaction and pick an option from the list.
        </p>
      </div>

      {!cloud && (
        <p className="rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm text-text-secondary dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-300">
          {isDemoMode
            ? 'Demo mode: categories are saved in this browser only.'
            : 'Sign in with Supabase configured to sync categories to your family account.'}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <KindSection
          kind={TransactionType.EXPENSE}
          title="Expense categories"
          hint="Used when you record money going out."
        />
        <KindSection
          kind={TransactionType.INCOME}
          title="Income categories"
          hint="Used when you record money coming in."
        />
      </div>
    </section>
  );
};
