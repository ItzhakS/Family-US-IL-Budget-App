import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTransactions } from '../contexts/TransactionsContext';
import { useShell } from '../contexts/ShellContext';
import { useBudgetCalculations } from '../hooks/useBudgetCalculations';
import { useTransactionListFilterState } from '../hooks/useTransactionListFilterState';
import { TransactionList } from '../components/TransactionList';
import { TransactionListFilters } from '../components/TransactionListFilters';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { DashboardMonthTable } from '../components/DashboardMonthTable';
import { useTheme } from '../contexts/ThemeContext';

export const DashboardPage: React.FC = () => {
  const { transactions, remove } = useTransactions();
  const { selectedYears, exchangeRate, openEditForm, openCopyForm } = useShell();
  const { isDark } = useTheme();
  const {
    yearFilteredTransactions,
    ilsSummary,
    usdSummary,
    getMonthlyData,
    getCategoryData,
  } = useBudgetCalculations(transactions, selectedYears, exchangeRate);

  const { listDisplayTransactions, listEmptyMessage, transactionListFilterProps } =
    useTransactionListFilterState(yearFilteredTransactions, selectedYears);

  const ils = '₪';
  const chartTheme = {
    grid: isDark ? '#374151' : '#e5e7eb',
    tick: isDark ? '#9ca3af' : '#6b7280',
    tooltipBg: isDark ? '#111827' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
    tooltipText: isDark ? '#f9fafb' : '#111827',
    income: isDark ? '#4ade80' : '#16a34a',
    expense: isDark ? '#f87171' : '#dc2626',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 border-b pb-2 border-indigo-100 dark:border-indigo-900">
          {ils} Shekels (ILS)
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hidden md:block">
            <p className="text-xs text-gray-500 dark:text-gray-400">Income</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {ils}
              {ilsSummary.income.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hidden md:block">
            <p className="text-xs text-gray-500 dark:text-gray-400">Expense</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {ils}
              {ilsSummary.expense.toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-indigo-950/40 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-indigo-900 col-span-2">
            <p className="text-xs text-blue-600 dark:text-indigo-300">Net Balance</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-indigo-100">
              {ils}
              {ilsSummary.balance.toLocaleString()}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">Monthly breakdown</p>
          <div className="hidden md:block bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getMonthlyData('ILS')}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick }} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick }} />
                <Tooltip
                  formatter={(v) => `${ils}${Number(v).toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    borderColor: chartTheme.tooltipBorder,
                    color: chartTheme.tooltipText,
                  }}
                  labelStyle={{ color: chartTheme.tooltipText }}
                />
                <Bar dataKey="income" fill={chartTheme.income} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill={chartTheme.expense} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="md:hidden">
            <DashboardMonthTable data={getMonthlyData('ILS')} currency="ILS" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">Top Expenses</p>
          <div className="space-y-2">
            {getCategoryData('ILS').slice(0, 5).map((c) => (
              <div key={c.name} className="flex justify-between text-sm border-b border-gray-50 dark:border-gray-700 pb-1">
                <span className="text-gray-600 dark:text-gray-300">{c.name}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {ils}
                  {c.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-200 border-b pb-2 border-emerald-100 dark:border-emerald-900">$ Dollars (USD)</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hidden md:block">
            <p className="text-xs text-gray-500 dark:text-gray-400">Income</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">${usdSummary.income.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hidden md:block">
            <p className="text-xs text-gray-500 dark:text-gray-400">Expense</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">${usdSummary.expense.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 dark:bg-emerald-950/40 p-4 rounded-xl shadow-sm border border-green-100 dark:border-emerald-900 col-span-2">
            <p className="text-xs text-green-600 dark:text-emerald-300">Net Balance</p>
            <p className="text-2xl font-bold text-green-900 dark:text-emerald-100">${usdSummary.balance.toLocaleString()}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">Monthly breakdown</p>
          <div className="hidden md:block bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getMonthlyData('USD')}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick }} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick }} />
                <Tooltip
                  formatter={(v) => `$${Number(v).toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    borderColor: chartTheme.tooltipBorder,
                    color: chartTheme.tooltipText,
                  }}
                  labelStyle={{ color: chartTheme.tooltipText }}
                />
                <Bar dataKey="income" fill={chartTheme.income} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill={chartTheme.expense} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="md:hidden">
            <DashboardMonthTable data={getMonthlyData('USD')} currency="USD" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">Top Expenses</p>
          <div className="space-y-2">
            {getCategoryData('USD').slice(0, 5).map((c) => (
              <div key={c.name} className="flex justify-between text-sm border-b border-gray-50 dark:border-gray-700 pb-1">
                <span className="text-gray-600 dark:text-gray-300">{c.name}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">${c.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50 border-b pb-2 border-gray-100 dark:border-gray-700">Recent Transactions</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          List defaults to this calendar month (your device time zone). Charts above still follow the selected year
          range.
        </p>
        <TransactionListFilters {...transactionListFilterProps} />
        <TransactionList
          transactions={listDisplayTransactions}
          onDelete={(id) => void remove(id)}
          onEdit={openEditForm}
          onCopy={openCopyForm}
          emptyMessage={listEmptyMessage}
        />
      </div>

      <div className="lg:col-span-2">
        <AnalysisPanel transactions={yearFilteredTransactions} />
      </div>
    </div>
  );
};
