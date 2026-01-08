import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, Currency, MaaserMonthStats } from '../types';
import { Heart, ChevronDown, ChevronUp, AlertCircle, Edit, Trash2 } from 'lucide-react';

interface MaaserTrackerProps {
  transactions: Transaction[];
  currency: Currency;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const MaaserTracker: React.FC<MaaserTrackerProps> = ({ transactions, currency, onEdit, onDelete }) => {
  const currencySymbol = currency === 'ILS' ? '₪' : '$';
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const monthlyStats = useMemo(() => {
    // 1. Group transactions by month
    const grouped: Record<string, Transaction[]> = {};
    const allMonths = new Set<string>();

    transactions
      .filter(t => t.currency === currency)
      .forEach(t => {
        const monthKey = t.date.substring(0, 7); // YYYY-MM
        allMonths.add(monthKey);
        if (!grouped[monthKey]) grouped[monthKey] = [];
        grouped[monthKey].push(t);
      });

    // Sort months chronologically
    const sortedMonths = Array.from(allMonths).sort();

    const stats: MaaserMonthStats[] = [];
    let runningBalance = 0;

    sortedMonths.forEach(month => {
      const monthTx = grouped[month];
      
      const income = monthTx
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

      const deductibleTx = monthTx.filter(t => t.type === TransactionType.EXPENSE && t.isMaaserDeductible);
      
      const deductions = deductibleTx.reduce((sum, t) => sum + t.amount, 0);

      const netProfit = income - deductions;
      const obligation = Math.max(0, netProfit * 0.10); // 10% of profit

      const paid = monthTx
        .filter(t => t.type === TransactionType.EXPENSE && t.isMaaserPayment)
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyBalance = obligation - paid;
      runningBalance += monthlyBalance;

      stats.push({
        month,
        income,
        deductions,
        deductibleTransactions: deductibleTx,
        netProfit,
        obligation,
        paid,
        monthlyBalance,
        runningBalance
      });
    });

    // Reverse for display (newest first)
    return stats.reverse();
  }, [transactions, currency]);

  const currentBalance = monthlyStats.length > 0 ? monthlyStats[0].runningBalance : 0;

  // Get all maaser-related transactions (deductibles and payments) for this currency
  const maaserTransactions = useMemo(() => {
    return transactions
      .filter(t => t.currency === currency && (t.isMaaserDeductible || t.isMaaserPayment))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currency]);

  return (
    <div className="space-y-4">
       {/* Top Status Card */}
      <div className={`p-4 rounded-xl border ${currentBalance > 0 ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
        <div className="flex items-center justify-between mb-2">
           <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
             <Heart className="text-pink-500" size={16} />
             Ma'aser Fund ({currency})
           </h3>
        </div>
        
        <div className="flex items-baseline gap-2">
           <span className="text-2xl font-bold text-gray-900">
             {currencySymbol}{Math.abs(currentBalance).toLocaleString()}
           </span>
           <span className={`text-xs font-medium uppercase tracking-wide ${currentBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
             {currentBalance > 0 ? 'Owed' : 'Credit'}
           </span>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="px-3 py-2 text-left font-medium">Month</th>
                <th className="px-3 py-2 text-right font-medium text-green-600">Income</th>
                <th className="px-3 py-2 text-right font-medium text-amber-600">Deduct</th>
                <th className="px-3 py-2 text-right font-medium text-gray-800">Profit</th>
                <th className="px-3 py-2 text-right font-medium bg-gray-100">10%</th>
                <th className="px-3 py-2 text-right font-medium text-pink-600">Paid</th>
                <th className="px-3 py-2 text-right font-medium">Run. Bal</th>
                <th className="px-1 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthlyStats.map((stat) => (
                <React.Fragment key={stat.month}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{stat.month}</td>
                    <td className="px-3 py-2 text-right text-green-600 whitespace-nowrap">+{stat.income.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-amber-600 whitespace-nowrap">-{stat.deductions.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-medium whitespace-nowrap">{stat.netProfit.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right bg-gray-50 font-medium whitespace-nowrap">{stat.obligation.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-pink-600 whitespace-nowrap">{stat.paid.toLocaleString()}</td>
                    <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${stat.runningBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {stat.runningBalance > 0 ? '' : '-'}{Math.abs(stat.runningBalance).toLocaleString()}
                    </td>
                    <td className="px-1 py-2 text-center">
                      {stat.deductions > 0 && (
                        <button 
                          onClick={() => setExpandedMonth(expandedMonth === stat.month ? null : stat.month)}
                          className="text-gray-400 hover:text-indigo-600"
                        >
                          {expandedMonth === stat.month ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </td>
                  </tr>
                  {/* Expanded Detail View for Deductibles */}
                  {expandedMonth === stat.month && stat.deductions > 0 && (
                    <tr className="bg-amber-50/50">
                      <td colSpan={8} className="p-3">
                        <div className="text-xs">
                          <p className="font-semibold text-amber-800 mb-2 flex items-center gap-1">
                            <AlertCircle size={12} />
                            Deductible Business Expenses ({stat.month})
                          </p>
                          <ul className="space-y-1">
                            {stat.deductibleTransactions.map(t => (
                              <li key={t.id} className="flex justify-between text-gray-600 border-b border-amber-100 pb-1 last:border-0">
                                <span>{t.description}</span>
                                <span>{currencySymbol}{t.amount.toLocaleString()}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {monthlyStats.length === 0 && (
                 <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                       No data.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maaser Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Heart className="text-pink-500" size={18} />
            Ma'aser Transactions ({currency})
          </h3>
          <p className="text-xs text-gray-500 mt-1">Deductible expenses and charity payments</p>
        </div>
        <div className="overflow-x-auto">
          {maaserTransactions.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {maaserTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{t.description}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        t.isMaaserPayment 
                          ? 'bg-pink-100 text-pink-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.isMaaserPayment ? 'Charity Payment' : 'Deductible'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold text-right whitespace-nowrap ${
                      t.isMaaserPayment ? 'text-pink-600' : 'text-amber-600'
                    }`}>
                      {currencySymbol}{t.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(t.id)}
                            className="text-gray-400 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Edit transaction"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(t.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete transaction"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <p className="text-sm">No ma'aser transactions yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
