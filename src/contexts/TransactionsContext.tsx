import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { Transaction } from '../types';
import { useAuth } from './AuthContext';
import * as transactionService from '../services/transactionService';

const sortTransactionsByDate = (txs: Transaction[]) =>
  [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

interface TransactionsContextValue {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  update: (id: string, tx: Omit<Transaction, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  removeByMaaserOffsetPairId: (pairId: string) => Promise<void>;
  bulkCreate: (items: Omit<Transaction, 'id'>[]) => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export const useTransactions = () => {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions must be used within a TransactionsProvider');
  return ctx;
};

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isDemoMode, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const txs = await transactionService.getAll();
      setTransactions(txs);
    } catch (e) {
      console.error('Failed to load transactions:', e);
      setError(e instanceof Error ? e.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setTransactions([]);
      return;
    }
    void refresh();
  }, [user, isDemoMode, authLoading, refresh]);

  const add = useCallback(async (tx: Omit<Transaction, 'id'>) => {
    setError(null);
    const tempId = `temp-${Math.random().toString(36).slice(2)}`;
    const optimistic: Transaction = { ...tx, id: tempId };
    setTransactions((prev) => sortTransactionsByDate([optimistic, ...prev]));
    try {
      const created = await transactionService.create(tx);
      setTransactions((prev) =>
        sortTransactionsByDate([
          created,
          ...prev.filter((t) => t.id !== tempId),
        ])
      );
    } catch (e) {
      console.error('Error adding transaction:', e);
      setTransactions((prev) => prev.filter((t) => t.id !== tempId));
      setError(e instanceof Error ? e.message : 'Failed to save transaction');
      await refresh();
    }
  }, [refresh]);

  const update = useCallback(
    async (id: string, tx: Omit<Transaction, 'id'>) => {
      setError(null);
      const previous = transactions;
      setTransactions((prev) =>
        sortTransactionsByDate(
          prev.map((t) => (t.id === id ? { ...t, ...tx, id } : t))
        )
      );
      try {
        await transactionService.update(id, tx);
        await refresh();
      } catch (e) {
        console.error('Error updating transaction:', e);
        setTransactions(previous);
        setError(e instanceof Error ? e.message : 'Failed to update transaction');
        await refresh();
      }
    },
    [transactions, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      setError(null);
      const previous = transactions;
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      try {
        await transactionService.deleteTransaction(id);
      } catch (e) {
        console.error('Error deleting transaction:', e);
        setTransactions(previous);
        setError(e instanceof Error ? e.message : 'Failed to delete transaction');
      }
    },
    [transactions]
  );

  const removeByMaaserOffsetPairId = useCallback(
    async (pairId: string) => {
      setError(null);
      const previous = transactions;
      setTransactions((prev) => prev.filter((t) => t.maaserOffsetPairId !== pairId));
      try {
        await transactionService.deleteByMaaserOffsetPairId(pairId);
      } catch (e) {
        console.error('Error deleting offset pair:', e);
        setTransactions(previous);
        setError(e instanceof Error ? e.message : 'Failed to delete offset');
        await refresh();
      }
    },
    [transactions, refresh]
  );

  const bulkCreate = useCallback(
    async (items: Omit<Transaction, 'id'>[]) => {
      setError(null);
      const previous = transactions;
      try {
        const created = await transactionService.bulkCreate(items);
        setTransactions((prev) => sortTransactionsByDate([...created, ...prev]));
      } catch (e) {
        console.error('Error bulk creating transactions:', e);
        setTransactions(previous);
        setError(e instanceof Error ? e.message : 'Failed to import transactions');
        await refresh();
      }
    },
    [transactions, refresh]
  );

  const value: TransactionsContextValue = {
    transactions,
    loading,
    error,
    refresh,
    add,
    update,
    remove,
    removeByMaaserOffsetPairId,
    bulkCreate,
  };

  return (
    <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>
  );
};
