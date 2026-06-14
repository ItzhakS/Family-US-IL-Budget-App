import React, { useEffect, useMemo, useState } from 'react';
import { X, ArrowLeftRight } from 'lucide-react';
import type { Currency, Transaction } from '../types';
import type { ExchangeRate } from '../services/exchangeRateService';
import {
  buildMaaserCreditBuckets,
  computeCrossCurrencyOffsetAmounts,
  computeMaxCrossCurrencyOffset,
  getMaaserRunningBalance,
  getAvailableMaaserCredit,
} from '../lib/maaserCalculations';
import {
  createMaaserCrossCurrencyOffset,
  deleteMaaserCrossCurrencyOffsetPair,
  validateMaaserCrossCurrencyOffset,
} from '../services/maaserOffsetService';

function sym(c: Currency): string {
  return c === 'ILS' ? '₪' : '$';
}

function balanceLabel(balance: number): string {
  if (balance > 0) return 'Owed';
  if (balance < 0) return 'Credit';
  return 'Settled';
}

export interface MaaserCrossCurrencyOffsetFormProps {
  transactions: Transaction[];
  exchangeRate: ExchangeRate | null;
  creditCurrency: Currency;
  debtCurrency: Currency;
  /** When editing, delete this pair before creating the new one. */
  editingPairId?: string | null;
  initialDate?: string;
  initialAmount?: string;
  initialAmountSide?: 'credit' | 'debt';
  onSuccess: () => void;
  onClose: () => void;
}

export const MaaserCrossCurrencyOffsetForm: React.FC<MaaserCrossCurrencyOffsetFormProps> = ({
  transactions,
  exchangeRate,
  creditCurrency,
  debtCurrency,
  editingPairId,
  initialDate,
  initialAmount,
  initialAmountSide = 'debt',
  onSuccess,
  onClose,
}) => {
  const [date, setDate] = useState(
    initialDate ?? new Date().toISOString().split('T')[0]
  );
  const [amountSide, setAmountSide] = useState<'credit' | 'debt'>(initialAmountSide);
  const [amount, setAmount] = useState(initialAmount ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creditBalance = useMemo(
    () => getMaaserRunningBalance(transactions, creditCurrency),
    [transactions, creditCurrency]
  );
  const debtBalance = useMemo(
    () => getMaaserRunningBalance(transactions, debtCurrency),
    [transactions, debtCurrency]
  );
  const availableCredit = useMemo(
    () => getAvailableMaaserCredit(transactions, creditCurrency, exchangeRate),
    [transactions, creditCurrency, exchangeRate]
  );
  const buckets = useMemo(
    () => buildMaaserCreditBuckets(transactions, creditCurrency, exchangeRate),
    [transactions, creditCurrency, exchangeRate]
  );

  const parsedAmount = parseFloat(amount);
  const preview = useMemo(() => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return null;
    return computeCrossCurrencyOffsetAmounts({
      creditCurrency,
      debtCurrency,
      amount: parsedAmount,
      amountSide,
      buckets,
      debtOwed: debtBalance,
    });
  }, [
    parsedAmount,
    amountSide,
    buckets,
    creditCurrency,
    debtCurrency,
    debtBalance,
  ]);

  useEffect(() => {
    if (!initialAmount && !editingPairId) {
      const max = computeMaxCrossCurrencyOffset(
        transactions,
        creditCurrency,
        debtCurrency,
        exchangeRate
      );
      if (max) {
        setAmount(String(max.debtLegAmount));
        setAmountSide('debt');
      }
    }
  }, [transactions, creditCurrency, debtCurrency, exchangeRate, initialAmount, editingPairId]);

  const handleApplyMax = () => {
    const max = computeMaxCrossCurrencyOffset(
      transactions,
      creditCurrency,
      debtCurrency,
      exchangeRate
    );
    if (max) {
      setAmount(String(max.debtLegAmount));
      setAmountSide('debt');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    const validationError = validateMaaserCrossCurrencyOffset({
      date,
      creditCurrency,
      debtCurrency,
      amount: parsedAmount,
      amountSide,
      transactions,
      globalRate: exchangeRate,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      if (editingPairId) {
        await deleteMaaserCrossCurrencyOffsetPair(editingPairId);
      }
      await createMaaserCrossCurrencyOffset({
        date,
        creditCurrency,
        debtCurrency,
        amount: parsedAmount,
        amountSide,
        transactions,
        globalRate: exchangeRate,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save offset.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700"
        role="dialog"
        aria-labelledby="maaser-offset-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h2
            id="maaser-offset-title"
            className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2"
          >
            <ArrowLeftRight className="text-indigo-500" size={20} />
            {editingPairId ? 'Edit' : 'Balance'} cross-currency ma&apos;aser
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Apply {creditCurrency} credit against {debtCurrency} owed using FIFO rates from
            months that built the credit pool.
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3 border border-green-100 dark:border-green-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">{creditCurrency} credit</p>
              <p className="font-bold text-green-700 dark:text-green-300">
                {sym(creditCurrency)}
                {Math.abs(creditBalance).toLocaleString()}{' '}
                <span className="text-xs font-normal">({balanceLabel(creditBalance)})</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Available: {sym(creditCurrency)}
                {availableCredit.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-100 dark:border-amber-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">{debtCurrency} owed</p>
              <p className="font-bold text-amber-700 dark:text-amber-300">
                {sym(debtCurrency)}
                {debtBalance.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Enter amount in
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setAmountSide('debt')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                  amountSide === 'debt'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                }`}
              >
                {debtCurrency} owed
              </button>
              <button
                type="button"
                onClick={() => setAmountSide('credit')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                  amountSide === 'credit'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                }`}
              >
                {creditCurrency} credit
              </button>
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              required
            />
            <button
              type="button"
              onClick={handleApplyMax}
              className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Apply maximum offset
            </button>
          </div>

          {preview && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3 border border-gray-100 dark:border-gray-700 space-y-2 text-sm">
              <p className="font-medium text-gray-800 dark:text-gray-100">Preview</p>
              <p className="text-gray-600 dark:text-gray-300">
                Credit leg: {sym(creditCurrency)}
                {preview.creditLegAmount.toLocaleString()} ({creditCurrency})
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Debt leg: {sym(debtCurrency)}
                {preview.debtLegAmount.toLocaleString()} ({debtCurrency})
              </p>
              <p className="text-xs text-gray-500">
                Effective rate: 1 USD = {preview.effectiveRateUsdToIls.toFixed(4)} ILS
              </p>
              {preview.bucketBreakdown.length > 0 && (
                <ul className="text-xs text-gray-500 space-y-1 mt-2">
                  {preview.bucketBreakdown.map((s, i) => (
                    <li key={`${s.month}-${i}`}>
                      {s.month}: {sym(creditCurrency)}
                      {s.creditAmount.toLocaleString()} @ {s.avgRateUsdToIls.toFixed(2)} →{' '}
                      {sym(debtCurrency)}
                      {s.debtAmount.toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !preview}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Saving…' : editingPairId ? 'Update offset' : 'Apply offset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
