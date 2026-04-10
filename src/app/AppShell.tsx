import { useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  Wallet,
  LayoutDashboard,
  Heart,
  CalendarClock,
  Briefcase,
  Calendar,
  LogOut,
  Loader2,
  Database,
  Key,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TransactionsProvider, useTransactions } from '../contexts/TransactionsContext';
import { CategoriesProvider } from '../contexts/CategoriesContext';
import { ShellProvider, useShell } from '../contexts/ShellContext';
import { YearSelector } from '../components/YearSelector';
import { FamilyManager } from '../components/FamilyManager';
import { TransactionForm } from '../components/TransactionForm';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import type { Transaction } from '../types';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/maaser', label: "Ma'aser", icon: Heart },
  { to: '/recurring', label: 'Recurring', icon: CalendarClock },
  { to: '/investments', label: 'Inv/Tax', icon: Briefcase },
  { to: '/yearly', label: 'Yearly', icon: Calendar },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const AppShellInner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user, isDemoMode, loading, enterDemo, logout } = useAuth();
  const { transactions, loading: dataLoading, add, update } = useTransactions();
  const {
    exchangeRate,
    selectedYears,
    setSelectedYears,
    isFormOpen,
    editingTransaction,
    copyFromTransaction,
    setIsFormOpen,
    setEditingTransaction,
    setCopyFromTransaction,
  } = useShell();

  const currentYear = new Date().getFullYear();
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map((t) => new Date(t.date).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  useEffect(() => {
    if (!loading && !user && isSupabaseConfigured && !isDemoMode) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate, isDemoMode]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  if (!isSupabaseConfigured && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Database className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Setup Required</h1>
          <p className="text-gray-600 mb-6">
            Your family budget app is ready, but it needs a database to store your data.
          </p>

          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                <LayoutDashboard size={18} /> 1. Create Supabase Project
              </h3>
              <p className="text-sm text-indigo-800 mb-2">
                Go to{' '}
                <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-bold">
                  supabase.com
                </a>
                , create a free project, and copy the SQL code provided in the deployment instructions.
              </p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                <Key size={18} /> 2. Connect to App
              </h3>
              <p className="text-sm text-indigo-800">
                If deploying to Vercel, add these Environment Variables:
              </p>
              <ul className="text-xs font-mono bg-white p-3 rounded mt-2 border border-indigo-100 text-gray-600">
                <li className="mb-1">REACT_APP_SUPABASE_URL</li>
                <li>REACT_APP_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            Once you add these keys and refresh, the app will start automatically.
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={enterDemo}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 py-2"
            >
              Explore without signing in
            </button>
            <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto">
              Local demo only — data stays in this browser and is not synced.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const handleSaveTransaction = (tx: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      void update(editingTransaction.id, tx);
    } else {
      void add(tx);
    }
    setIsFormOpen(false);
    setEditingTransaction(null);
    setCopyFromTransaction(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-2 min-h-14 py-1.5 md:py-0 md:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                type="button"
                className="md:hidden shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100 -ml-1"
                onClick={() => setMobileNavOpen(true)}
                aria-expanded={mobileNavOpen}
                aria-label="Open navigation menu"
              >
                <Menu size={22} />
              </button>

              <div className="hidden md:flex items-center gap-3 shrink-0">
                {isDemoMode && (
                  <span className="rounded-md bg-amber-100 text-amber-900 text-xs font-bold px-2 py-1 border border-amber-200 tracking-wide whitespace-nowrap">
                    TEST VIEW
                  </span>
                )}
                {exchangeRate && (
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 whitespace-nowrap">
                      <span className="font-semibold">$1 = ₪{exchangeRate.usdToIls.toFixed(2)}</span>
                      <span className="mx-1.5 text-gray-400">•</span>
                      <span className="font-semibold">₪1 = ${exchangeRate.ilsToUsd.toFixed(4)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 min-w-0 shrink-0">
                <div className="bg-indigo-600 p-2 rounded-lg text-white shrink-0">
                  <Wallet size={20} />
                </div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight truncate hidden sm:block">
                  Family Budget
                </h1>
              </div>

              <div className="h-6 w-px bg-gray-200 hidden md:block shrink-0" />

              <div className="min-w-0 flex-1 md:flex-initial">
                <YearSelector
                  availableYears={availableYears}
                  selectedYears={selectedYears}
                  onChange={setSelectedYears}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              {dataLoading && <Loader2 className="animate-spin text-indigo-600 hidden sm:block" size={16} />}
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-gray-700">{user.name}</span>
                <span className="text-[10px] text-gray-400">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingTransaction(null);
                  setCopyFromTransaction(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add</span>
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title={isDemoMode ? 'Exit demo' : 'Sign Out'}
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-2 pb-2 overflow-x-auto">
            {isDemoMode && (
              <span className="shrink-0 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-1 border border-amber-200 tracking-wide whitespace-nowrap">
                TEST VIEW
              </span>
            )}
            {exchangeRate && (
              <div className="shrink-0 text-[10px] text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200 whitespace-nowrap">
                <span className="font-semibold">$1 = ₪{exchangeRate.usdToIls.toFixed(2)}</span>
                <span className="mx-1 text-gray-400">·</span>
                <span className="font-semibold">₪1 = ${exchangeRate.ilsToUsd.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div
            className="fixed top-0 left-0 z-50 h-full w-[min(20rem,92vw)] bg-white shadow-2xl md:hidden flex flex-col border-r border-gray-100"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
          >
            <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-100">
              <span className="font-semibold text-gray-900">Menu</span>
              <button
                type="button"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-indigo-50 text-indigo-900' : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon size={20} className="shrink-0" />
                  <span className="text-left">{label}</span>
                </NavLink>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                type="button"
                               onClick={() => {
                  setMobileNavOpen(false);
                  setEditingTransaction(null);
                  setCopyFromTransaction(null);
                  setIsFormOpen(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-sm"
              >
                <Plus size={18} />
                Add transaction
              </button>
            </div>
          </div>
        </>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isDemoMode && (
          <div className="flex justify-end mb-4">
            <FamilyManager />
          </div>
        )}

        <nav className="hidden md:flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl mb-8 w-full lg:w-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </main>

      {isFormOpen && (
        <TransactionForm
          transaction={editingTransaction || undefined}
          copyFrom={!editingTransaction ? copyFromTransaction || undefined : undefined}
          onSave={handleSaveTransaction}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTransaction(null);
            setCopyFromTransaction(null);
          }}
        />
      )}
    </div>
  );
};

export const AppShell: React.FC = () => {
  return (
    <CategoriesProvider>
      <TransactionsProvider>
        <ShellProvider>
          <AppShellInner />
        </ShellProvider>
      </TransactionsProvider>
    </CategoriesProvider>
  );
};
