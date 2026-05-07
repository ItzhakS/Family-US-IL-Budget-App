import type { FC } from 'react';
import type { MonthlyDataPoint } from '../hooks/useBudgetCalculations';
import type { Currency } from '../types';

/** Month-by-month income / expense table (Ma'aser-style), for dashboard mobile view. */
export const DashboardMonthTable: FC<{
  data: MonthlyDataPoint[];
  currency: Currency;
}> = ({ data, currency }) => {
  const sym = currency === 'ILS' ? '\u20AA' : '$';
  const rows = data.filter((d) => d.income > 0 || d.expense > 0);
  const fmt = (n: number) => `${sym}${n.toLocaleString()}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <th className="px-3 py-2 text-left font-medium">Month</th>
              <th className="px-3 py-2 text-right font-medium text-green-600 dark:text-green-400">Income</th>
              <th className="px-3 py-2 text-right font-medium text-red-600 dark:text-red-400">Expense</th>
              <th className="px-3 py-2 text-right font-medium text-gray-800 dark:text-gray-200">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {rows.map((row) => {
              const net = row.income - row.expense;
              return (
                <tr key={row.sortKey} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-50 whitespace-nowrap">{row.name}</td>
                  <td className="px-3 py-2 text-right text-green-600 dark:text-green-400 whitespace-nowrap">{fmt(row.income)}</td>
                  <td className="px-3 py-2 text-right text-red-600 dark:text-red-400 whitespace-nowrap">{fmt(row.expense)}</td>
                  <td
                    className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${net >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'}`}
                  >
                    {net >= 0 ? '+' : ''}
                    {fmt(Math.abs(net))}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  No activity in this year range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
