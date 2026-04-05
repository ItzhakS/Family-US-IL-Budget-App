import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Transaction } from '../types';
import {
  type ExchangeRate,
  getExchangeRate,
  getExchangeRateOffline,
} from '../services/exchangeRateService';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useTransactions } from './TransactionsContext';

interface ShellContextValue {
  selectedYears: number[];
  setSelectedYears: React.Dispatch<React.SetStateAction<number[]>>;
  exchangeRate: ExchangeRate | null;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
  openEditForm: (id: string) => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export const useShell = () => {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useShell must be used within a ShellProvider');
  return ctx;
};

export const ShellProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoMode } = useAuth();
  const { transactions } = useTransactions();

  const currentYear = new Date().getFullYear();
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!user) {
      setExchangeRate(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const rate =
          isDemoMode || !isSupabaseConfigured
            ? await getExchangeRateOffline()
            : await getExchangeRate();
        if (!cancelled) setExchangeRate(rate);
      } catch (e) {
        console.error('Error fetching exchange rate:', e);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user, isDemoMode]);

  const openEditForm = useCallback(
    (id: string) => {
      const t = transactions.find((x) => x.id === id);
      if (t) {
        setEditingTransaction(t);
        setIsFormOpen(true);
      }
    },
    [transactions]
  );

  const value = useMemo(
    () => ({
      selectedYears,
      setSelectedYears,
      exchangeRate,
      isFormOpen,
      setIsFormOpen,
      editingTransaction,
      setEditingTransaction,
      openEditForm,
    }),
    [selectedYears, exchangeRate, isFormOpen, editingTransaction, openEditForm]
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
};
