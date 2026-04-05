import React from 'react';
import { Transaction, TransactionType } from '../types';
import { CalendarClock, CheckCircle2 } from 'lucide-react';

interface RecurringPanelProps {
  transactions: Transaction[];
}

export const RecurringPanel: React.FC<RecurringPanelProps> = ({ transactions }) => {
  // Filter for recurring items
  const recurring = transactions.filter(t => t.type === TransactionType.EXPENSE && t.isRecurring);

  // Group distinct recurring items by description to show "Average cost" or "Last paid"
  // simplified: just show the list of all recurring items logged sorted by date
  
  // A better view: Show a list of "Active" recurring bills found in the last 30 days?
  // For now, let's just list the history of items tagged as recurring.
  
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
                <th className="px-4 py-3 text-right">Amount</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
            {recurring.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{t.date}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-500" />
                        {t.description}
                    </td>
                    <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-600">{t.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                        {t.currency === 'ILS' ? '₪' : '$'}{t.amount.toLocaleString()}
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
        {recurring.length === 0 && (
            <div className="text-center py-8 text-gray-400">
                <p>No transactions marked as 'Recurring' yet.</p>
                <p className="text-xs mt-1">Check the "Recurring Bill" box when adding household expenses.</p>
            </div>
        )}
      </div>
    </div>
  );
};
