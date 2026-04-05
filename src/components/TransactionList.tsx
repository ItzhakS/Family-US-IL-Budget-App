import React from 'react';
import { Transaction, TransactionType } from '../types';
import { Trash2, ArrowUpRight, ArrowDownLeft, Receipt, HeartHandshake, Edit } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onEdit }) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💸</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No transactions yet</h3>
        <p className="text-gray-500 mt-1">Add your first income or expense to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                <td className="py-4 px-6 text-sm text-gray-500 whitespace-nowrap">{t.date}</td>
                <td className="py-4 px-6 text-sm text-gray-900 font-medium">
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {t.category}
                  </span>
                </td>
                <td className={`py-4 px-6 text-sm font-bold text-right whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-gray-900'}`}>
                  <div className="flex items-center justify-end gap-1">
                    {t.type === TransactionType.INCOME ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} className="text-gray-400" />}
                    {t.type === TransactionType.EXPENSE ? '-' : '+'}{t.currency === 'ILS' ? '₪' : '$'}{t.amount.toLocaleString()}
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
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
                    <button
                      onClick={() => onDelete(t.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete transaction"
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