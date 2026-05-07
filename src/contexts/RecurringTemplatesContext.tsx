import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { RecurringTemplate } from '../types';
import { useAuth } from './AuthContext';
import { useTransactions } from './TransactionsContext';
import { isDemoSessionActive } from '../services/demoStorage';
import * as recurringTemplateService from '../services/recurringTemplateService';
import * as transactionService from '../services/transactionService';
import { planAllGenerations } from '../lib/recurringGeneration';
import { buildLegacyTemplateSeeds } from '../lib/recurringMigration';

interface RecurringTemplatesContextValue {
  templates: RecurringTemplate[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (
    input: Omit<RecurringTemplate, 'id' | 'familyId' | 'createdAt' | 'updatedAt'>
  ) => Promise<RecurringTemplate>;
  update: (
    id: string,
    patch: Partial<Omit<RecurringTemplate, 'id' | 'familyId' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const RecurringTemplatesContext = createContext<RecurringTemplatesContextValue | null>(null);

export const useRecurringTemplates = () => {
  const ctx = useContext(RecurringTemplatesContext);
  if (!ctx)
    throw new Error('useRecurringTemplates must be used within a RecurringTemplatesProvider');
  return ctx;
};

export const RecurringTemplatesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isDemoMode, loading: authLoading } = useAuth();
  const { transactions, refresh: refreshTransactions, loading: txLoading } = useTransactions();

  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Once-per-session bookkeeping for the auto-generation pass. */
  const generationRanRef = useRef(false);
  const migrationRanRef = useRef(false);
  const txFetchStartedRef = useRef(false);
  const [templatesReady, setTemplatesReady] = useState(false);
  const [transactionsReady, setTransactionsReady] = useState(false);

  const refresh = useCallback(async () => {
    const demo = isDemoSessionActive() || isDemoMode;
    if (!user && !demo) {
      setTemplates([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await recurringTemplateService.getAll();
      setTemplates(rows);
    } catch (e) {
      console.error('Failed to load recurring templates:', e);
      setError(e instanceof Error ? e.message : 'Failed to load recurring templates');
      setTemplates([]);
    } finally {
      setLoading(false);
      setTemplatesReady(true);
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    // Reset one-shot guards when auth/demo context changes.
    generationRanRef.current = false;
    migrationRanRef.current = false;
    txFetchStartedRef.current = false;
    setTemplatesReady(false);
    setTransactionsReady(false);
  }, [user?.id, isDemoMode]);

  useEffect(() => {
    const demo = isDemoSessionActive() || isDemoMode;
    if (!user && !demo) {
      txFetchStartedRef.current = false;
      setTransactionsReady(false);
      return;
    }

    if (txLoading) {
      txFetchStartedRef.current = true;
      return;
    }

    // Consider transactions hydrated once we observed at least one loading cycle,
    // or when there is data already available.
    if (txFetchStartedRef.current || transactions.length > 0) {
      setTransactionsReady(true);
    }
  }, [user, isDemoMode, txLoading, transactions.length]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [refresh, authLoading]);

  const create = useCallback<RecurringTemplatesContextValue['create']>(
    async (input) => {
      const created = await recurringTemplateService.create(input);
      setTemplates((prev) => [...prev, created]);
      return created;
    },
    []
  );

  const update = useCallback<RecurringTemplatesContextValue['update']>(
    async (id, patch) => {
      const merged = await recurringTemplateService.update(id, patch);
      setTemplates((prev) => prev.map((t) => (t.id === id ? merged : t)));
    },
    []
  );

  const cancel = useCallback<RecurringTemplatesContextValue['cancel']>(async (id) => {
    const updated = await recurringTemplateService.cancel(id);
    setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const remove = useCallback<RecurringTemplatesContextValue['remove']>(async (id) => {
    await recurringTemplateService.deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * One-shot legacy migration on load: collapse pre-existing `isRecurring`
   * transactions (with no template id) into synthetic templates so they show
   * up in the new Recurring page and future months auto-generate.
   * Runs once per session when both transactions and templates have loaded.
   */
  useEffect(() => {
    if (authLoading || loading || txLoading) return;
    if (!user && !(isDemoSessionActive() || isDemoMode)) return;
    if (!templatesReady || !transactionsReady) return;
    if (migrationRanRef.current) return;

    const seeds = buildLegacyTemplateSeeds(transactions);
    if (seeds.length === 0) {
      migrationRanRef.current = true;
      return;
    }

    migrationRanRef.current = true;
    let cancelled = false;

    void (async () => {
      try {
        const created: RecurringTemplate[] = [];
        for (const seed of seeds) {
          const t = await recurringTemplateService.create(seed.template);
          created.push(t);
          if (seed.transactionIdsToLink.length > 0) {
            await transactionService.linkToRecurringTemplate(seed.transactionIdsToLink, t.id);
          }
        }
        if (cancelled) return;
        setTemplates((prev) => [...prev, ...created]);
        await refreshTransactions();
      } catch (e) {
        console.error('Legacy recurring migration failed:', e);
        // Allow a retry on next session.
        migrationRanRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    loading,
    txLoading,
    user,
    isDemoMode,
    templatesReady,
    transactionsReady,
    transactions,
    refreshTransactions,
  ]);

  /**
   * Auto-generate missing month transactions for every active template.
   * Runs once per session after templates + transactions are loaded AND after
   * the legacy migration pass has completed (we wait one more render so newly
   * migrated templates are part of the planning input).
   */
  useEffect(() => {
    if (authLoading || loading || txLoading) return;
    if (!user && !(isDemoSessionActive() || isDemoMode)) return;
    if (!templatesReady || !transactionsReady) return;
    if (!migrationRanRef.current) return;
    if (generationRanRef.current) return;
    if (templates.length === 0) {
      generationRanRef.current = true;
      return;
    }

    const plans = planAllGenerations(templates, transactions, new Date());
    if (plans.length === 0) {
      generationRanRef.current = true;
      return;
    }

    generationRanRef.current = true;
    let cancelled = false;

    void (async () => {
      try {
        const allItems = plans.flatMap((p) => p.items.map((i) => i.transaction));
        if (allItems.length > 0) {
          await transactionService.bulkCreate(allItems);
        }
        for (const plan of plans) {
          if (!plan.templatePatch) continue;
          await recurringTemplateService.update(plan.templateId, plan.templatePatch);
        }
        if (cancelled) return;
        await refresh();
        await refreshTransactions();
      } catch (e) {
        console.error('Recurring generation pass failed:', e);
        // Allow a retry on next session.
        generationRanRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    loading,
    txLoading,
    user,
    isDemoMode,
    templatesReady,
    transactionsReady,
    templates,
    transactions,
    refresh,
    refreshTransactions,
  ]);

  const value: RecurringTemplatesContextValue = {
    templates,
    loading,
    error,
    refresh,
    create,
    update,
    cancel,
    remove,
  };

  return (
    <RecurringTemplatesContext.Provider value={value}>
      {children}
    </RecurringTemplatesContext.Provider>
  );
};
