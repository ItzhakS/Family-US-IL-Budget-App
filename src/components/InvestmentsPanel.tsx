import React from 'react';
import { Transaction, TransactionType } from '../types';
import { TrendingUp, Briefcase, Edit, Trash2 } from 'lucide-react';

interface InvestmentsPanelProps {
  transactions: Transaction[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const InvestmentsPanel: React.FC<InvestmentsPanelProps> = ({ transactions, onEdit, onDelete }) => {
  // Filter for Investments
  const investments = transactions.filter(t => t.type === TransactionType.EXPENSE && t.isInvestment);
  
  // Filter for Tax Savings
  const taxSavings = transactions.filter(t => t.type === TransactionType.EXPENSE && t.isTaxSavings);
  
  // Filter for Business Expenses (Tax Deductible Only)
  const taxDeductibles = transactions.filter(t => t.type === TransactionType.EXPENSE && t.isTaxDeductible);

  // Group by year for totals
  const getTotals = (txs: Transaction[]) => {
    const ils = txs.filter(t => t.currency === 'ILS').reduce((sum, t) => sum + t.amount, 0);
    const usd = txs.filter(t => t.currency === 'USD').reduce((sum, t) => sum + t.amount, 0);
    return { ils, usd };
  };

  const invTotals = getTotals(investments);
  const taxSavingsTotals = getTotals(taxSavings);
  const taxTotals = getTotals(taxDeductibles);

  return (
    <div className="space-y-6">
      
      {/* Investments Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <TrendingUp size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Investments</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium mb-1">Total ILS Invested</p>
            <p className="text-2xl font-bold text-gray-900">₪{invTotals.ils.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium mb-1">Total USD Invested</p>
            <p className="text-2xl font-bold text-gray-900">${invTotals.usd.toLocaleString()}</p>
          </div>
        </div>

        <h3 className="font-semibold text-gray-700 mb-3">Recent Deposits</h3>
        <div className="space-y-2">
          {investments.slice(0, 5).map(t => (
            <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm group hover:bg-gray-100 transition-colors">
              <div className="flex flex-col flex-1">
                 <span className="font-medium text-gray-900">{t.description}</span>
                 <span className="text-xs text-gray-500">{t.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-blue-600">
                  {t.currency === 'ILS' ? '₪' : '$'}{t.amount.toLocaleString()}
                </span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(t.id)}
                      className="text-gray-400 hover:text-indigo-500 transition-colors"
                      title="Edit transaction"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(t.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {investments.length === 0 && <p className="text-sm text-gray-400">No investment records yet.</p>}
        </div>
      </div>

      {/* Tax Savings Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
            <TrendingUp size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Tax Savings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium mb-1">Total ILS Saved</p>
            <p className="text-2xl font-bold text-gray-900">₪{taxSavingsTotals.ils.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium mb-1">Total USD Saved</p>
            <p className="text-2xl font-bold text-gray-900">${taxSavingsTotals.usd.toLocaleString()}</p>
          </div>
        </div>

        <h3 className="font-semibold text-gray-700 mb-3">Recent Deposits</h3>
        <div className="space-y-2">
          {taxSavings.slice(0, 5).map(t => (
            <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm group hover:bg-gray-100 transition-colors">
              <div className="flex flex-col flex-1">
                 <span className="font-medium text-gray-900">{t.description}</span>
                 <span className="text-xs text-gray-500">{t.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-purple-600">
                  {t.currency === 'ILS' ? '₪' : '$'}{t.amount.toLocaleString()}
                </span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(t.id)}
                      className="text-gray-400 hover:text-indigo-500 transition-colors"
                      title="Edit transaction"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(t.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {taxSavings.length === 0 && <p className="text-sm text-gray-400">No tax savings records yet.</p>}
        </div>
      </div>

      {/* Tax Deductible Business Expenses Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Business Expenses (Tax Claim)</h2>
            <p className="text-xs text-gray-500">Expenses for tax filing only (Do not affect Ma'aser)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 font-medium mb-1">Total ILS Expenses</p>
            <p className="text-2xl font-bold text-gray-900">₪{taxTotals.ils.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 font-medium mb-1">Total USD Expenses</p>
            <p className="text-2xl font-bold text-gray-900">${taxTotals.usd.toLocaleString()}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
             <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                   <th className="px-4 py-2">Date</th>
                   <th className="px-4 py-2">Description</th>
                   <th className="px-4 py-2 text-right">Amount</th>
                   <th className="px-4 py-2 text-right">Actions</th>
                </tr>
             </thead>
             <tbody>
                {taxDeductibles.map(t => (
                   <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-2 text-gray-500">{t.date}</td>
                      <td className="px-4 py-2 font-medium text-gray-900">{t.description}</td>
                      <td className="px-4 py-2 text-right">
                         {t.currency === 'ILS' ? '₪' : '$'}{t.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right">
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
          {taxDeductibles.length === 0 && <p className="text-sm text-gray-400 p-4 text-center">No business expenses logged.</p>}
        </div>
      </div>
    </div>
  );
};
