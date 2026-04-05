import React from 'react';
import { Transaction, TransactionType } from '../types';
import { Trash2, ArrowUpRight, ArrowDownLeft, Receipt, HeartHandshake, Edit } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  /** When the parent narrowed the list with filters and nothing matches */
  emptyMessage?: { title: string; subtitle?: string };
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDelete,
  onEdit,
  emptyMessage,
}) => {
  if (transactions.length === 0) {
    const title = emptyMessage?.title ?? 'No transactions yet';
    const subtitle =
      emptyMessage?.subtitle ?? 'Add your first income or expense to get started.';
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
        <div className="bg-gray-50 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💸</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/80 border-b border-gray-100 dark:border-gray-600">
            <tr>
              <th
                scope="col"
                className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                scope="col"
                className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                scope="col"
                className="text-right py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                className="text-right py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{t.date}</td>
                <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-50 font-medium">
                    <div className="flex items-center gap-2">
                        {t.isMaaserPayment && (
                          <span title="Ma'aser Payment" className="flex items-center">
                            <HeartHandshake size={14} className="text-pink-500" />
                          </span>
                        )}
                        {(t.isMaaserDeductible || t.isTaxDeductible) && (
                          <span title="Deductible Expense" className="flex items-center">
                            <Receipt size={14} className="text-amber-500" />
                          </span>
                        )}
                        {t.description}
                    </div>
                </td>
                <td className="py-4 px-6 text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {t.category}
                  </span>
                </td>
                <td
                  className={`py-4 px-6 text-sm font-bold text-right whitespace-nowrap ${
                    t.type === TransactionType.INCOME
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-900 dark:text-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-end gap-1">
                    {t.type === TransactionType.INCOME ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} className="text-gray-400" />}
                    {t.type === TransactionType.EXPENSE ? '-' : '+'}{t.currency === 'ILS' ? '₪' : '$'}{t.amount.toLocaleString()}
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(t.id)}
                        className="text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                        title="Edit transaction"
                        aria-label="Edit transaction"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(t.id)}
                      className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                      title="Delete transaction"
                      aria-label="Delete transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};