import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Transaction, TransactionType, Currency, User } from '../types';
import { getExchangeRate, getExchangeRateOffline, ExchangeRate, convertCurrency } from '../services/exchangeRateService';
import { getDemoSeedTransactions } from '../lib/demoSeedTransactions';
import {
  readDemoTransactions,
  writeDemoTransactions,
  setDemoSessionActive,
  isDemoSessionActive,
} from '../services/demoStorage';

const DEMO_GUEST: User = { id: 'demo', name: 'Guest', email: 'Local demo' };

const sortTransactionsByDate = (txs: Transaction[]) =>
  [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

interface BudgetSummary {
  income: number;
  expense: number;
  balance: number;
}

interface MonthlyDataPoint {
  name: string;
  income: number;
  expense: number;
  sortKey: string;
}

interface CategoryDataPoint {
  name: string;
  value: number;
}

interface AppContextValue {
  user: User | null;
  isDemoMode: boolean;
  loading: boolean;
  dataLoading: boolean;
  transactions: Transaction[];
  yearFilteredTransactions: Transaction[];
  dashboardTransactions: Transaction[];
  exchangeRate: ExchangeRate | null;
  selectedYears: number[];
  availableYears: number[];
  isFormOpen: boolean;
  editingTransaction: Transaction | null;
  ilsSummary: BudgetSummary;
  usdSummary: BudgetSummary;
  setSelectedYears: (years: number[]) => void;
  setIsFormOpen: (open: boolean) => void;
  setEditingTransaction: (tx: Transaction | null) => void;
  handleLogout: () => Promise<void>;
  handleAddTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  handleUpdateTransaction: (id: string, tx: Omit<Transaction, 'id'>) => Promise<void>;
  handleDeleteTransaction: (id: string) => Promise<void>;
  enterDemo: () => void;
  openEditForm: (id: string) => void;
  getMonthlyData: (currency: Currency) => MonthlyDataPoint[];
  getCategoryData: (currency: Currency) => CategoryDataPoint[];
  convertCurrency: (amount: number, from: Currency, to: Currency) => number | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(() => isDemoSessionActive());
  const isDemoModeRef = useRef(isDemoMode);
  isDemoModeRef.current = isDemoMode;

  const [user, setUser] = useState<User | null>(() =>
    isDemoSessionActive() ? DEMO_GUEST : null
  );
  const [loading, setLoading] = useState(() => !isDemoSessionActive());
  const [dataLoading, setDataLoading] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (!isDemoSessionActive()) return [];
    let txs = readDemoTransactions();
    if (txs.length === 0) {
      txs = getDemoSeedTransactions();
      writeDemoTransactions(txs);
    }
    return sortTransactionsByDate(txs);
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const currentYear = new Date().getFullYear();
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  const yearFilteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txYear = parseInt(t.date.split('-')[0]);
      return selectedYears.includes(txYear);
    });
  }, [transactions, selectedYears]);

  const dashboardTransactions = useMemo(() => {
    return yearFilteredTransactions.filter(t =>
      !t.isMaaserDeductible &&
      !t.isTaxDeductible &&
      !t.isInvestment &&
      !t.isTaxSavings
    );
  }, [yearFilteredTransactions]);

  const getSummary = useCallback((curr: Currency): BudgetSummary => {
    const txs = dashboardTransactions.filter(t => t.currency === curr);
    const income = txs.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expense = txs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [dashboardTransactions]);

  const ilsSummary = useMemo(() => getSummary('ILS'), [getSummary]);
  const usdSummary = useMemo(() => getSummary('USD'), [getSummary]);

  const getMonthlyData = useCallback((curr: Currency): MonthlyDataPoint[] => {
    const data: Record<string, MonthlyDataPoint> = {};
    [...selectedYears].sort((a, b) => a - b).forEach(year => {
      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${String(m).padStart(2, '0')}`;
        const name = new Date(year, m - 1, 1).toLocaleString('default', {
          month: 'short',
          year: selectedYears.length > 1 ? '2-digit' : undefined
        });
        data[key] = { name, income: 0, expense: 0, sortKey: key };
      }
    });

    dashboardTransactions.filter(t => t.currency === curr).forEach(t => {
      const key = t.date.substring(0, 7);
      if (data[key]) {
        if (t.type === TransactionType.INCOME) data[key].income += t.amount;
        else data[key].expense += t.amount;
      }
    });

    return Object.values(data).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [selectedYears, dashboardTransactions]);

  const getCategoryData = useCallback((curr: Currency): CategoryDataPoint[] => {
    const categories: Record<string, number> = {};
    dashboardTransactions
      .filter(t => t.currency === curr && t.type === TransactionType.EXPENSE)
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [dashboardTransactions]);

  const convertCurrencyValue = useCallback((amount: number, from: Currency, to: Currency): number | null => {
    if (!exchangeRate) return null;
    return convertCurrency(amount, from, to, exchangeRate);
  }, [exchangeRate]);

  const openEditForm = useCallback((id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setEditingTransaction(transaction);
      setIsFormOpen(true);
    }
  }, [transactions]);

  const enterDemo = () => {
    setDemoSessionActive(true);
    setIsDemoMode(true);
    isDemoModeRef.current = true;
    let txs = readDemoTransactions();
    if (txs.length === 0) {
      txs = getDemoSeedTransactions();
      writeDemoTransactions(txs);
    }
    setTransactions(sortTransactionsByDate(txs));
    setUser(DEMO_GUEST);
    setLoading(false);
  };

  const exitDemo = () => {
    setDemoSessionActive(false);
    setIsDemoMode(false);
    isDemoModeRef.current = false;
    setUser(null);
    setTransactions([]);
    setExchangeRate(null);
  };

  useEffect(() => {
    if (isDemoMode) {
      getExchangeRateOffline().then(setExchangeRate);
    }
  }, [isDemoMode]);

  const fetchTransactions = async () => {
    if (isDemoModeRef.current) {
      setDataLoading(true);
      try {
        const txs = sortTransactionsByDate(readDemoTransactions());
        setTransactions(txs);
      } finally {
        setDataLoading(false);
      }
      return;
    }
    if (!isSupabaseConfigured) return;
    setDataLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const mappedData: Transaction[] = (data || []).map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
        type: t.type,
        currency: t.currency,
        isMaaserDeductible: t.is_maaser_deductible,
        isMaaserPayment: t.is_maaser_payment,
        isTaxDeductible: t.is_tax_deductible,
        isInvestment: t.is_investment,
        isTaxSavings: t.is_tax_savings,
        isRecurring: t.is_recurring
      }));

      setTransactions(mappedData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchExchangeRate = async () => {
    try {
      if (isDemoModeRef.current) {
        const rate = await getExchangeRateOffline();
        setExchangeRate(rate);
        return;
      }
      if (!isSupabaseConfigured) return;
      const rate = await getExchangeRate();
      setExchangeRate(rate);
    } catch (err) {
      console.error('Error fetching exchange rate:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const isOAuthCallback = hashParams.has('access_token') || hashParams.has('error');

    if (hashParams.has('error')) {
      const errorDescription = hashParams.get('error_description') || hashParams.get('error');
      console.error('OAuth error:', errorDescription);
      window.history.replaceState(null, '', window.location.pathname);
      setLoading(false);
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {});
      return () => subscription.unsubscribe();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setDemoSessionActive(false);
        setIsDemoMode(false);
        isDemoModeRef.current = false;
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        });
        fetchTransactions();
        fetchExchangeRate();
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setTransactions([]);
        setExchangeRate(null);
        setLoading(false);
      }
    });

    const checkSession = async () => {
      if (isOAuthCallback) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session error:', error);
      }

      if (session?.user) {
        setDemoSessionActive(false);
        setIsDemoMode(false);
        isDemoModeRef.current = false;
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        });
        fetchTransactions();
        fetchExchangeRate();
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      if (!isOAuthCallback || !session?.user) {
        setLoading(false);
      }
    };

    checkSession();

    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key && (e.key.includes('supabase') || e.key.startsWith('sb-'))) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setDemoSessionActive(false);
          setIsDemoMode(false);
          isDemoModeRef.current = false;
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
          });
          fetchTransactions();
          fetchExchangeRate();
        } else if (!isDemoSessionActive()) {
          setUser(null);
          setTransactions([]);
          setExchangeRate(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    if (isDemoMode) {
      exitDemo();
      return;
    }
    await supabase.auth.signOut();
  };

  const handleAddTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    if (isDemoMode) {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const row: Transaction = { ...newTx, id };
      setTransactions(prev => {
        const next = sortTransactionsByDate([row, ...prev]);
        writeDemoTransactions(next);
        return next;
      });
      return;
    }
    if (!isSupabaseConfigured) return;
    try {
      const tempId = Math.random().toString();
      const optimisticTx = { ...newTx, id: tempId };
      setTransactions(prev => sortTransactionsByDate([optimisticTx, ...prev]));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error("Could not fetch user profile");

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          date: newTx.date,
          description: newTx.description,
          amount: newTx.amount,
          category: newTx.category,
          type: newTx.type,
          currency: newTx.currency,
          is_recurring: newTx.isRecurring,
          is_maaser_deductible: newTx.isMaaserDeductible,
          is_maaser_payment: newTx.isMaaserPayment,
          is_tax_deductible: newTx.isTaxDeductible,
          is_investment: newTx.isInvestment,
          is_tax_savings: newTx.isTaxSavings,
          family_id: profile.family_id
        })
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => {
        const filtered = prev.filter(t => t.id !== tempId);
        const mapped: Transaction = {
          id: data.id,
          date: data.date,
          description: data.description,
          amount: data.amount,
          category: data.category,
          type: data.type,
          currency: data.currency,
          isMaaserDeductible: data.is_maaser_deductible,
          isMaaserPayment: data.is_maaser_payment,
          isTaxDeductible: data.is_tax_deductible,
          isInvestment: data.is_investment,
          isTaxSavings: data.is_tax_savings,
          isRecurring: data.is_recurring
        };
        return sortTransactionsByDate([mapped, ...filtered]);
      });
    } catch (err) {
      console.error('Error adding transaction:', err);
      fetchTransactions();
    }
  };

  const handleUpdateTransaction = async (id: string, updatedTx: Omit<Transaction, 'id'>) => {
    if (isDemoMode) {
      setTransactions(prev => {
        const next = sortTransactionsByDate(
          prev.map(t => (t.id === id ? { ...updatedTx, id } : t))
        );
        writeDemoTransactions(next);
        return next;
      });
      return;
    }
    if (!isSupabaseConfigured) return;
    try {
      const oldTx = transactions.find(t => t.id === id);
      setTransactions(prev =>
        sortTransactionsByDate(prev.map(t => (t.id === id ? { ...updatedTx, id } : t)))
      );

      const { error } = await supabase
        .from('transactions')
        .update({
          date: updatedTx.date,
          description: updatedTx.description,
          amount: updatedTx.amount,
          category: updatedTx.category,
          type: updatedTx.type,
          currency: updatedTx.currency,
          is_recurring: updatedTx.isRecurring,
          is_maaser_deductible: updatedTx.isMaaserDeductible,
          is_maaser_payment: updatedTx.isMaaserPayment,
          is_tax_deductible: updatedTx.isTaxDeductible,
          is_investment: updatedTx.isInvestment,
          is_tax_savings: updatedTx.isTaxSavings
        })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating transaction:', err);
      fetchTransactions();
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (isDemoMode) {
      setTransactions(prev => {
        const next = prev.filter(t => t.id !== id);
        writeDemoTransactions(next);
        return next;
      });
      return;
    }
    if (!isSupabaseConfigured) return;
    try {
      const oldTxs = [...transactions];
      setTransactions(prev => prev.filter(t => t.id !== id));

      const { error } = await supabase.from('transactions').delete().eq('id', id);

      if (error) {
        setTransactions(oldTxs);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  const value: AppContextValue = {
    user,
    isDemoMode,
    loading,
    dataLoading,
    transactions,
    yearFilteredTransactions,
    dashboardTransactions,
    exchangeRate,
    selectedYears,
    availableYears,
    isFormOpen,
    editingTransaction,
    ilsSummary,
    usdSummary,
    setSelectedYears,
    setIsFormOpen,
    setEditingTransaction,
    handleLogout,
    handleAddTransaction,
    handleUpdateTransaction,
    handleDeleteTransaction,
    enterDemo,
    openEditForm,
    getMonthlyData,
    getCategoryData,
    convertCurrency: convertCurrencyValue,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
