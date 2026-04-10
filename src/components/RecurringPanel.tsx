import React from 'react';
import { Transaction } from '../types';
import { CalendarClock, CheckCircle2, Ban, MinusCircle } from 'lucide-react';
import { isActiveRecurringListRow, omitTransactionId } from '../lib/recurringUtils';

interface RecurringPanelProps {
  transactions: Transaction[];
  onUpdateTransaction: (id: string, patch: Omit<Transaction, 'id'>) => void | Promise<void>;
}

export const RecurringPanel: React.FC<RecurringPanelProps> = ({
  transactions,
  onUpdateTransaction,
}) => {
  const recurring = transactions
    .filter(isActiveRecurringListRow)
    .sort((a, b) => b.date.localeCompare(a.date));

  const cancel = (t: Transaction) => {
    void onUpdateTransaction(t.id, {
      ...omitTransactionId(t),
      recurringCancelledAt: new Date().toISOString(),
    });
  };

  const recordPayment = (t: Transaction) => {
    const r = t.recurringRemainingPayments;
    if (r == null || r <= 0) return;
    void onUpdateTransaction(t.id, {
      ...omitTransactionId(t),
      recurringRemainingPayments: r - 1,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
          <CalendarClock size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Monthly Recurring Charges</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Bill Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Remaining</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recurring.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{t.date}</td>
                <td className="px-4 py-3 font-medium text-gray-900 min-w-0">
                  <div className="flex items-start gap-2 min-w-0">
                    <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" aria-hidden />
                    <span className="min-w-0 break-words leading-snug">{t.description}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-600">
                    {t.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                  {t.recurringRemainingPayments == null ? '—' : t.recurringRemainingPayments}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {t.currency === 'ILS' ? '\u20AA' : '$'}
                  {t.amount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {t.recurringRemainingPayments != null && t.recurringRemainingPayments > 0 && (
                      <button
                        type="button"
                        onClick={() => recordPayment(t)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        title="Record one payment (decrements remaining count)"
                      >
                        <MinusCircle size={14} className="text-indigo-600" aria-hidden />
                        Record payment
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => cancel(t)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-100"
                      title="Stop showing this bill as an active recurring charge"
                    >
                      <Ban size={14} aria-hidden />
                      Cancel recurring
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recurring.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>No active recurring expenses for the selected period.</p>
            <p className="text-xs mt-1">
              Mark an expense as a monthly recurring bill when adding or editing it, or cancel recurring items you no
              longer track here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
