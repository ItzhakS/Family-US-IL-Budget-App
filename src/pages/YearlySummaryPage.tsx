import { Calendar } from 'lucide-react';
import { useTransactions } from '../contexts/TransactionsContext';
import { useShell } from '../contexts/ShellContext';
import { useBudgetCalculations } from '../hooks/useBudgetCalculations';
import { TransactionType } from '../types';

export const YearlySummaryPage: React.FC = () => {
  const { transactions } = useTransactions();
  const { selectedYears, exchangeRate } = useShell();
  const { yearFilteredTransactions, dashboardTransactions, convertCurrency } = useBudgetCalculations(
    transactions,
    selectedYears,
    exchangeRate
  );

  const ilsIncome = yearFilteredTransactions
    .filter((t) => t.currency === 'ILS' && t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);
  const ilsHouseholdExp = dashboardTransactions
    .filter((t) => t.currency === 'ILS' && t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);
  const ilsBusinessDeductibles = yearFilteredTransactions
    .filter((t) => t.currency === 'ILS' && (t.isMaaserDeductible || t.isTaxDeductible))
    .reduce((acc, t) => acc + t.amount, 0);

  const usdIncome = yearFilteredTransactions
    .filter((t) => t.currency === 'USD' && t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);
  const usdHouseholdExp = dashboardTransactions
    .filter((t) => t.currency === 'USD' && t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);
  const usdBusinessDeductibles = yearFilteredTransactions
    .filter((t) => t.currency === 'USD' && (t.isMaaserDeductible || t.isTaxDeductible))
    .reduce((acc, t) => acc + t.amount, 0);

  const ilsIncomeInUsd = convertCurrency(ilsIncome, 'ILS', 'USD');
  const ilsHouseholdExpInUsd = convertCurrency(ilsHouseholdExp, 'ILS', 'USD');
  const ilsBusinessDeductiblesInUsd = convertCurrency(ilsBusinessDeductibles, 'ILS', 'USD');

  const usdIncomeInIls = convertCurrency(usdIncome, 'USD', 'ILS');
  const usdHouseholdExpInIls = convertCurrency(usdHouseholdExp, 'USD', 'ILS');
  const usdBusinessDeductiblesInIls = convertCurrency(usdBusinessDeductibles, 'USD', 'ILS');

  const totalIls = ilsIncome + (usdIncomeInIls || 0);
  const totalUsd = usdIncome + (ilsIncomeInUsd || 0);
  const totalIlsExp = ilsHouseholdExp + (usdHouseholdExpInIls || 0);
  const totalUsdExp = usdHouseholdExp + (ilsHouseholdExpInUsd || 0);
  const totalIlsDeductibles = ilsBusinessDeductibles + (usdBusinessDeductiblesInIls || 0);
  const totalUsdDeductibles = usdBusinessDeductibles + (ilsBusinessDeductiblesInUsd || 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
      <Calendar size={48} className="mx-auto text-indigo-200 mb-4" />
      <h3 className="text-lg font-bold text-gray-900">Totals for {selectedYears.join(', ')}</h3>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-bold text-gray-800 mb-2">ILS Totals</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Income</span>
              <div className="text-right">
                <span className="font-mono">₪{ilsIncome.toLocaleString()}</span>
                {usdIncomeInIls != null && usdIncomeInIls !== 0 && (
                  <span className="text-xs text-gray-500 ml-2">(+${usdIncome.toLocaleString()})</span>
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm font-semibold text-gray-700 border-t pt-1">
              <span>Total Income</span>
              <span className="font-mono">₪{totalIls.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Household Exp</span>
              <div className="text-right">
                <span className="font-mono">₪{ilsHouseholdExp.toLocaleString()}</span>
                {usdHouseholdExpInIls != null && usdHouseholdExpInIls !== 0 && (
                  <span className="text-xs text-gray-500 ml-2">(+${usdHouseholdExp.toLocaleString()})</span>
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm font-semibold text-gray-700 border-t pt-1">
              <span>Total Household Exp</span>
              <span className="font-mono">₪{totalIlsExp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-amber-600">
              <span>Business Deductibles</span>
              <div className="text-right">
                <span className="font-mono">₪{ilsBusinessDeductibles.toLocaleString()}</span>
                {usdBusinessDeductiblesInIls != null && usdBusinessDeductiblesInIls !== 0 && (
                  <span className="text-xs text-amber-500 ml-2">(+${usdBusinessDeductibles.toLocaleString()})</span>
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm font-semibold text-amber-700 border-t pt-1">
              <span>Total Business Deductibles</span>
              <span className="font-mono">₪{totalIlsDeductibles.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-bold text-gray-800 mb-2">USD Totals</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Income</span>
              <div className="text-right">
                <span className="font-mono">${usdIncome.toLocaleString()}</span>
                {ilsIncomeInUsd != null && ilsIncomeInUsd !== 0 && (
                  <span className="text-xs text-gray-500 ml-2">(+₪{ilsIncome.toLocaleString()})</span>
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm font-semibold text-gray-700 border-t pt-1">
              <span>Total Income</span>
              <span className="font-mono">${totalUsd.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Household Exp</span>
              <div className="text-right">
                <span className="font-mono">${usdHouseholdExp.toLocaleString()}</span>
                {ilsHouseholdExpInUsd != null && ilsHouseholdExpInUsd !== 0 && (
                  <span className="text-xs text-gray-500 ml-2">(+₪{ilsHouseholdExp.toLocaleString()})</span>
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm font-semibold text-gray-700 border-t pt-1">
              <span>Total Household Exp</span>
              <span className="font-mono">${totalUsdExp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-amber-600">
              <span>Business Deductibles</span>
              <div className="text-right">
                <span className="font-mono">${usdBusinessDeductibles.toLocaleString()}</span>
                {ilsBusinessDeductiblesInUsd != null && ilsBusinessDeductiblesInUsd !== 0 && (
                  <span className="text-xs text-amber-500 ml-2">(+₪{ilsBusinessDeductibles.toLocaleString()})</span>
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm font-semibold text-amber-700 border-t pt-1">
              <span>Total Business Deductibles</span>
              <span className="font-mono">${totalUsdDeductibles.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
