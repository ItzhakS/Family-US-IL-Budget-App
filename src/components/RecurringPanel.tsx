import React from 'react';
import { CalendarClock, CheckCircle2, Ban, AlertCircle, Infinity as InfinityIcon } from 'lucide-react';
import { RecurringTemplate, TransactionType } from '../types';
import { isTemplateActive } from '../lib/recurringUtils';

interface RecurringPanelProps {
  templates: RecurringTemplate[];
  onCancel: (id: string) => void | Promise<void>;
}

type TemplateStatus = 'active' | 'cancelled' | 'exhausted';

function templateStatus(t: RecurringTemplate): TemplateStatus {
  if (t.cancelledAt) return 'cancelled';
  if (t.remainingPayments != null && t.remainingPayments <= 0) return 'exhausted';
  return 'active';
}

const statusBadgeClass: Record<TemplateStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  exhausted: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const statusLabel: Record<TemplateStatus, string> = {
  active: 'Active',
  cancelled: 'Cancelled',
  exhausted: 'Exhausted',
};

export const RecurringPanel: React.FC<RecurringPanelProps> = ({ templates, onCancel }) => {
  const sorted = [...templates].sort((a, b) => {
    const aActive = isTemplateActive(a) ? 0 : 1;
    const bActive = isTemplateActive(b) ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return a.description.localeCompare(b.description);
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-300">
          <CalendarClock size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">Recurring Templates</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Each template auto-generates a new transaction on day{' '}
        <span className="font-medium text-gray-700 dark:text-gray-200">N</span> of every month from its start month
        through the current month. Generated rows are independent — editing one only changes that
        month.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/80">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Day</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Remaining</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sorted.map((t) => {
              const status = templateStatus(t);
              const symbol = t.currency === 'ILS' ? '₪' : '$';
              return (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 align-top">
                  <td className="px-4 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {t.type === TransactionType.INCOME ? 'Income' : 'Expense'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-50 min-w-0">
                    <div className="flex items-start gap-2 min-w-0">
                      {status === 'active' ? (
                        <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" aria-hidden />
                      ) : (
                        <AlertCircle size={16} className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" aria-hidden />
                      )}
                      <span className="min-w-0 break-words leading-snug">{t.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">{t.dayOfMonth}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-50 tabular-nums whitespace-nowrap">
                    {symbol}
                    {t.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                    {t.remainingPayments == null ? (
                      <span className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500">
                        <InfinityIcon size={14} aria-hidden />
                        <span className="sr-only">Unlimited</span>
                      </span>
                    ) : (
                      t.remainingPayments
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass[status]}`}
                    >
                      {statusLabel[status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {status === 'active' && (
                        <button
                          type="button"
                          onClick={() => void onCancel(t.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-2 py-1 text-xs font-medium text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
                          title="Stop generating future transactions for this template"
                        >
                          <Ban size={14} aria-hidden />
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <p>No recurring templates yet.</p>
            <p className="text-xs mt-1">
              Add a transaction and tick &ldquo;Monthly Recurring Bill&rdquo; to create a template
              that auto-generates each month.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
