import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTransactions } from '../contexts/TransactionsContext';
import { useShell } from '../contexts/ShellContext';
import { useBudgetCalculations } from '../hooks/useBudgetCalculations';
import { useTransactionListFilterState } from '../hooks/useTransactionListFilterState';
import { TransactionList } from '../components/TransactionList';
import { TransactionListFilters } from '../components/TransactionListFilters';
import { AnalysisPanel } from '../components/AnalysisPanel';

export const DashboardPage: React.FC = () => {
  const { transactions, remove } = useTransactions();
  const { selectedYears, exchangeRate, openEditForm } = useShell();
  const {
    yearFilteredTransactions,
    ilsSummary,
    usdSummary,
    getMonthlyData,
    getCategoryData,
  } = useBudgetCalculations(transactions, selectedYears, exchangeRate);

  const { listDisplayTransactions, listEmptyMessage, transactionListFilterProps } =
    useTransactionListFilterState(yearFilteredTransactions, selectedYears);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              <Tooltip formatter={(v) => `₪${Number(v).toLocaleString()}`} />
              <Bar dataKey="income" fill="#4ade80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 mb-2">Top Expenses</p>
          <div className="space-y-2">
            {getCategoryData('ILS').slice(0, 5).map((c) => (
              <div key={c.name} className="flex justify-between text-sm border-b border-gray-50 pb-1">
                <span className="text-gray-600">{c.name}</span>
                <span className="font-medium">₪{c.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Bar dataKey="income" fill="#4ade80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 mb-2">Top Expenses</p>
          <div className="space-y-2">
            {getCategoryData('USD').slice(0, 5).map((c) => (
              <div key={c.name} className="flex justify-between text-sm border-b border-gray-50 pb-1">
                <span className="text-gray-600">{c.name}</span>
                <span className="font-medium">${c.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 border-b pb-2 border-gray-100">Recent Transactions</h2>
        <p className="text-xs text-gray-500">
          List defaults to this calendar month (your device time zone). Charts above still follow the selected year
          range.
        </p>
        <TransactionListFilters {...transactionListFilterProps} />
        <TransactionList
          transactions={listDisplayTransactions}
          onDelete={(id) => void remove(id)}
          onEdit={openEditForm}
          emptyMessage={listEmptyMessage}
        />
      </div>

      <div className="lg:col-span-2">
        <AnalysisPanel transactions={yearFilteredTransactions} />
      </div>
    </div>
  );
};
