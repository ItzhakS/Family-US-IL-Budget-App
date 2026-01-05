import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Plus, Wallet, LayoutDashboard, Heart, Calendar, Briefcase, CalendarClock, LogOut } from 'lucide-react';

import { Transaction, TransactionType, Currency, User } from './types';
import { COLORS } from './constants';
import { TransactionForm } from './components/TransactionForm';
import { StatCard } from './components/StatCard';
import { MaaserTracker } from './components/MaaserTracker';
import { RecurringPanel } from './components/RecurringPanel';
import { InvestmentsPanel } from './components/InvestmentsPanel';
import { Login } from './components/Login';
import { YearSelector } from './components/YearSelector';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'maaser' | 'recurring' | 'investments' | 'yearly'>('dashboard');
  
  // Year Filtering State
  const currentYear = new Date().getFullYear();
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);

  // Load user-specific data when user changes
  useEffect(() => {
    if (user) {
      const savedData = localStorage.getItem(`transactions_${user.id}`);
      setTransactions(savedData ? JSON.parse(savedData) : []);
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      setTransactions([]);
      localStorage.removeItem('currentUser');
    }
  }, [user]);

  // Save data to user-specific key
  useEffect(() => {
    if (user) {
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify(transactions));
    }
  }, [transactions, user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: uuidv4()
    };
    setTransactions(prev => [transaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  // --- Filtering Logic ---

  // 1. Filter by Selected Years
  const yearFilteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txYear = parseInt(t.date.split('-')[0]);
      return selectedYears.includes(txYear);
    });
  }, [transactions, selectedYears]);

  // 2. Logic for Dashboard (Household only, no Business Deductibles, no Investments)
  const dashboardTransactions = useMemo(() => {
    return yearFilteredTransactions.filter(t => 
      !t.isMaaserDeductible && 
      !t.isTaxDeductible && 
      !t.isInvestment
    );
  }, [yearFilteredTransactions]);

  // 3. Get list of all available years for the selector
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => parseInt(t.date.split('-')[0])));
    return Array.from(years);
  }, [transactions]);


  // --- Helper Functions for Dashboard ---
  const getSummary = (curr: Currency) => {
    const txs = dashboardTransactions.filter(t => t.currency === curr);
    const income = txs.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + curr.amount, 0);
    const expense = txs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, curr) => acc + curr.amount, 0);
    return { income, expense, balance: income - expense };
  };

  const ilsSummary = getSummary('ILS');
  const usdSummary = getSummary('USD');

  const getMonthlyData = (curr: Currency) => {
     // Generate months based on selected years. If 1 year selected -> Jan-Dec. If multiple -> just show data points available?
     // For simplicity in the chart, if multiple years are selected, we show chronological data of those years.
     
     // 1. Gather all YYYY-MM keys from selected years
     const data: Record<string, { name: string; income: number; expense: number; sortKey: string }> = {};
     
     // Initialize empty months for selected years
     selectedYears.sort((a,b) => a-b).forEach(year => {
        for(let m=1; m<=12; m++) {
            const key = `${year}-${String(m).padStart(2, '0')}`;
            const name = new Date(year, m-1, 1).toLocaleString('default', { month: 'short', year: selectedYears.length > 1 ? '2-digit' : undefined });
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
  };

  const getCategoryData = (curr: Currency) => {
    const categories: Record<string, number> = {};
    dashboardTransactions
      .filter(t => t.currency === curr && t.type === TransactionType.EXPENSE)
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                    <Wallet size={20} />
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight hidden md:block">Family Budget</h1>
              </div>
              
              <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
              
              <YearSelector 
                availableYears={availableYears}
                selectedYears={selectedYears}
                onChange={setSelectedYears}
              />
            </div>
            
            <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-xs font-bold text-gray-700">{user.name}</span>
                    <span className="text-[10px] text-gray-400">Synced to {user.email}</span>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add</span>
                </button>
                <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Sign Out"
                >
                    <LogOut size={20} />
                </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl mb-8 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('maaser')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'maaser' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Heart size={18} />
            Ma'aser
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'recurring' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CalendarClock size={18} />
            Recurring
          </button>
          <button
            onClick={() => setActiveTab('investments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'investments' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Briefcase size={18} />
            Inv/Tax
          </button>
           <button
            onClick={() => setActiveTab('yearly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar size={18} />
            Yearly
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: ILS World */}
            <div className="space-y-6">
               <h2 className="text-lg font-bold text-indigo-900 border-b pb-2 border-indigo-100">₪ Shekels (ILS)</h2>
               
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                     <p className="text-xs text-gray-500">Income</p>
                     <p className="text-xl font-bold text-green-600">₪{ilsSummary.income.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                     <p className="text-xs text-gray-500">Expense</p>
                     <p className="text-xl font-bold text-red-600">₪{ilsSummary.expense.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100 col-span-2">
                     <p className="text-xs text-blue-600">Net Balance</p>
                     <p className="text-2xl font-bold text-blue-900">₪{ilsSummary.balance.toLocaleString()}</p>
                  </div>
               </div>

               <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-64">
                    <p className="text-xs font-bold text-gray-400 mb-2">Monthly Trend</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getMonthlyData('ILS')}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: number) => `₪${v.toLocaleString()}`} />
                        <Bar dataKey="income" fill="#4ade80" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
               </div>
               
               {/* ILS Breakdown */}
               <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 mb-2">Top Expenses</p>
                    <div className="space-y-2">
                        {getCategoryData('ILS').slice(0, 5).map((c, i) => (
                           <div key={c.name} className="flex justify-between text-sm border-b border-gray-50 pb-1">
                              <span className="text-gray-600">{c.name}</span>
                              <span className="font-medium">₪{c.value.toLocaleString()}</span>
                           </div>
                        ))}
                    </div>
               </div>
            </div>

            {/* Right Column: USD World */}
            <div className="space-y-6">
               <h2 className="text-lg font-bold text-emerald-900 border-b pb-2 border-emerald-100">$ Dollars (USD)</h2>
               
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                     <p className="text-xs text-gray-500">Income</p>
                     <p className="text-xl font-bold text-green-600">${usdSummary.income.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                     <p className="text-xs text-gray-500">Expense</p>
                     <p className="text-xl font-bold text-red-600">${usdSummary.expense.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100 col-span-2">
                     <p className="text-xs text-green-600">Net Balance</p>
                     <p className="text-2xl font-bold text-green-900">${usdSummary.balance.toLocaleString()}</p>
                  </div>
               </div>

               <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-64">
                    <p className="text-xs font-bold text-gray-400 mb-2">Monthly Trend</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getMonthlyData('USD')}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                        <Bar dataKey="income" fill="#4ade80" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
               </div>

               {/* USD Breakdown */}
               <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 mb-2">Top Expenses</p>
                    <div className="space-y-2">
                        {getCategoryData('USD').slice(0, 5).map((c, i) => (
                           <div key={c.name} className="flex justify-between text-sm border-b border-gray-50 pb-1">
                              <span className="text-gray-600">{c.name}</span>
                              <span className="font-medium">${c.value.toLocaleString()}</span>
                           </div>
                        ))}
                    </div>
               </div>
            </div>

          </div>
        )}

        {activeTab === 'maaser' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 border-b pb-2">₪ Shekels (ILS)</h3>
                  {/* Note: We pass yearFilteredTransactions here so the Maaser view respects the selected year 
                      If you want Maaser to ALWAYS show running balance from ALL time, pass 'transactions' instead. 
                      However, typically UI views reflect the filter. */}
                  <MaaserTracker transactions={yearFilteredTransactions} currency="ILS" />
              </div>
              <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 border-b pb-2">$ Dollars (USD)</h3>
                  <MaaserTracker transactions={yearFilteredTransactions} currency="USD" />
              </div>
           </div>
        )}

        {activeTab === 'recurring' && (
           <RecurringPanel transactions={yearFilteredTransactions} />
        )}

        {activeTab === 'investments' && (
           <InvestmentsPanel transactions={yearFilteredTransactions} />
        )}

        {activeTab === 'yearly' && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <Calendar size={48} className="mx-auto text-indigo-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">
                Totals for {selectedYears.join(', ')}
              </h3>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                 <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-2">ILS Totals</h4>
                    <div className="space-y-2">
                       <div className="flex justify-between text-sm"><span>Income</span> <span className="font-mono">₪{yearFilteredTransactions.filter(t => t.currency === 'ILS' && t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</span></div>
                       <div className="flex justify-between text-sm"><span>Household Exp</span> <span className="font-mono">₪{dashboardTransactions.filter(t => t.currency === 'ILS' && t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</span></div>
                       <div className="flex justify-between text-sm text-amber-600"><span>Business Deductibles</span> <span className="font-mono">₪{yearFilteredTransactions.filter(t => t.currency === 'ILS' && (t.isMaaserDeductible || t.isTaxDeductible)).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</span></div>
                    </div>
                 </div>
                 <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-2">USD Totals</h4>
                     <div className="space-y-2">
                       <div className="flex justify-between text-sm"><span>Income</span> <span className="font-mono">${yearFilteredTransactions.filter(t => t.currency === 'USD' && t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</span></div>
                       <div className="flex justify-between text-sm"><span>Household Exp</span> <span className="font-mono">${dashboardTransactions.filter(t => t.currency === 'USD' && t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</span></div>
                       <div className="flex justify-between text-sm text-amber-600"><span>Business Deductibles</span> <span className="font-mono">${yearFilteredTransactions.filter(t => t.currency === 'USD' && (t.isMaaserDeductible || t.isTaxDeductible)).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</span></div>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </main>

      {/* Add Transaction Modal */}
      {isFormOpen && (
        <TransactionForm
          onSave={handleAddTransaction}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
