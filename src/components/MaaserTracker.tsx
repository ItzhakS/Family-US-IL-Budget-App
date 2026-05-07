import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, Currency, MaaserMonthStats } from '../types';
import { Heart, ChevronDown, ChevronUp, AlertCircle, Edit, Trash2 } from 'lucide-react';

/** Fund card + month-level breakdown (not affected by transaction-list filters). */
export const MaaserSummaryPanel: React.FC<{
  transactions: Transaction[];
  currency: Currency;
}> = ({ transactions, currency }) => {
  const currencySymbol = currency === 'ILS' ? '₪' : '$';
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const monthlyStats = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    const allMonths = new Set<string>();

    transactions
      .filter((t) => t.currency === currency)
      .forEach((t) => {
        const monthKey = t.date.substring(0, 7);
        allMonths.add(monthKey);
        if (!grouped[monthKey]) grouped[monthKey] = [];
        grouped[monthKey].push(t);
      });

    const sortedMonths = Array.from(allMonths).sort();

    const stats: MaaserMonthStats[] = [];
    let runningBalance = 0;

    sortedMonths.forEach((month) => {
      const monthTx = grouped[month];

      const income = monthTx
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

      const deductibleTx = monthTx.filter((t) => t.type === TransactionType.EXPENSE && t.isMaaserDeductible);

      const deductions = deductibleTx.reduce((sum, t) => sum + t.amount, 0);

      const netProfit = income - deductions;
      const obligation = Math.max(0, netProfit * 0.1);

      const paid = monthTx
        .filter((t) => t.type === TransactionType.EXPENSE && t.isMaaserPayment)
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
        runningBalance,
      });
    });

    return stats.reverse();
  }, [transactions, currency]);

  const currentBalance = monthlyStats.length > 0 ? monthlyStats[0].runningBalance : 0;

  return (
    <div className="space-y-4">
      <div
        className={`p-4 rounded-xl border ${currentBalance > 0 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900' : 'bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900'}`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 text-sm">
            <Heart className="text-pink-500" size={16} />
            Ma&apos;aser Fund ({currency})
          </h3>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            {currencySymbol}
            {Math.abs(currentBalance).toLocaleString()}
          </span>
          <span
            className={`text-xs font-medium uppercase tracking-wide ${currentBalance > 0 ? 'text-amber-600 dark:text-amber-300' : 'text-green-600 dark:text-green-300'}`}
          >
            {currentBalance > 0 ? 'Owed' : 'Credit'}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="px-3 py-2 text-left font-medium">Month</th>
                <th className="px-3 py-2 text-right font-medium text-green-600 dark:text-green-400">Income</th>
                <th className="px-3 py-2 text-right font-medium text-amber-600 dark:text-amber-400">Deduct</th>
                <th className="px-3 py-2 text-right font-medium text-gray-800 dark:text-gray-200">Profit</th>
                <th className="px-3 py-2 text-right font-medium bg-gray-100 dark:bg-gray-700">10%</th>
                <th className="px-3 py-2 text-right font-medium text-pink-600 dark:text-pink-400">Paid</th>
                <th className="px-3 py-2 text-right font-medium">Run. Bal</th>
                <th className="px-1 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {monthlyStats.map((stat) => (
                <React.Fragment key={stat.month}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-50 whitespace-nowrap">{stat.month}</td>
                    <td className="px-3 py-2 text-right text-green-600 dark:text-green-400 whitespace-nowrap">
                      +{stat.income.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      -{stat.deductions.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {stat.netProfit.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right bg-gray-50 dark:bg-gray-700/50 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {stat.obligation.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-pink-600 dark:text-pink-400 whitespace-nowrap">
                      {stat.paid.toLocaleString()}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-bold whitespace-nowrap ${stat.runningBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}
                    >
                      {stat.runningBalance > 0 ? '' : '-'}
                      {Math.abs(stat.runningBalance).toLocaleString()}
                    </td>
                    <td className="px-1 py-2 text-center">
                      {stat.deductions > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedMonth(expandedMonth === stat.month ? null : stat.month)}
                          className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                          aria-expanded={expandedMonth === stat.month}
                          aria-label={expandedMonth === stat.month ? 'Collapse month' : 'Expand month'}
                        >
                          {expandedMonth === stat.month ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedMonth === stat.month && stat.deductions > 0 && (
                    <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                      <td colSpan={8} className="p-3">
                        <div className="text-xs">
                          <p className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1">
                            <AlertCircle size={12} />
                            Deductible Business Expenses ({stat.month})
                          </p>
                          <ul className="space-y-1">
                            {stat.deductibleTransactions.map((t) => (
                              <li
                                key={t.id}
                                className="flex justify-between text-gray-600 dark:text-gray-300 border-b border-amber-100 dark:border-amber-900 pb-1 last:border-0"
                              >
                                <span>{t.description}</span>
                                <span>
                                  {currencySymbol}
                                  {t.amount.toLocaleString()}
                                </span>
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
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                    No data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function maaserSym(c: Currency) {
  return c === 'ILS' ? '₪' : '$';
}

/** Ma&apos;aser-related transaction rows (deductibles + payments), after list filters. */
export const MaaserTransactionListPanel: React.FC<{
  transactions: Transaction[];
  /** Omit for a combined ILS+USD list (e.g. single mobile card). */
  currency?: Currency;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}> = ({ transactions, currency, onEdit, onDelete }) => {
  const mixed = currency === undefined;
  const titleSuffix = mixed ? 'ILS & USD' : currency;
  const rows =
    transactions.length > 0 ? [...transactions].sort((a, b) => b.date.localeCompare(a.date)) : [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <Heart className="text-pink-500 shrink-0" size={18} />
          <span className="min-w-0">Ma&apos;aser Transactions ({titleSuffix})</span>
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Deductible expenses and charity payments</p>
      </div>
      {rows.length > 0 ? (
        <>
          <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-700">
            {rows.map((t) => {
              const currencySymbol = maaserSym(t.currency);
              return (
                <div key={t.id} className="p-4 space-y-2">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">{t.date}</span>
                    {mixed && (
                      <span className="text-[10px] font-semibold uppercase text-gray-400 dark:text-gray-500">{t.currency}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 break-words">{t.description}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        t.isMaaserPayment ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {t.isMaaserPayment ? 'Charity Payment' : 'Deductible'}
                    </span>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        t.isMaaserPayment ? 'text-pink-600 dark:text-pink-400' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {currencySymbol}
                      {t.amount.toLocaleString()}
                    </span>
                  </div>
                  {(onEdit || onDelete) && (
                    <div className="flex justify-end gap-2 pt-1">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(t.id)}
                          className="text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                          aria-label="Edit transaction"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(t.id)}
                          className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                          aria-label="Delete transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/80 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  {mixed && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Curr
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rows.map((t) => {
                  const currencySymbol = maaserSym(t.currency);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{t.date}</td>
                      {mixed && (
                        <td className="px-4 py-3 text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">{t.currency}</td>
                      )}
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-50 font-medium max-w-xs break-words">
                        {t.description}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            t.isMaaserPayment ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {t.isMaaserPayment ? 'Charity Payment' : 'Deductible'}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-bold text-right whitespace-nowrap ${
                          t.isMaaserPayment ? 'text-pink-600 dark:text-pink-400' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {currencySymbol}
                        {t.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(t.id)}
                              className="text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
                              title="Edit transaction"
                              aria-label="Edit transaction"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(t.id)}
                              className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
                              title="Delete transaction"
                              aria-label="Delete transaction"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-gray-400 dark:text-gray-500">
          <p className="text-sm">No matching ma&apos;aser transactions.</p>
          <p className="text-xs mt-1">Widen month, search, or currency filters above.</p>
        </div>
      )}
    </div>
  );
};
