import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, ReceiptData, Currency } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/constants';
import { X, Loader2, Camera, RefreshCw } from 'lucide-react';
import { parseReceiptImage } from '../services/geminiService';
import { useCategories } from '../contexts/CategoriesContext';
import { useToast } from '../contexts/ToastContext';

/** Extra options the form emits when the user opts into a recurring schedule. */
export interface CreateRecurringTemplateInput {
  dayOfMonth: number;
  startMonth: string; // YYYY-MM
  /** null = unlimited; numeric value is total payment cap including the row being created. */
  totalPaymentsCap: number | null;
}

interface TransactionFormProps {
  transaction?: Transaction;
  /** Create new row prefilled from this transaction (date reset to today in form). */
  copyFrom?: Transaction;
  onSave: (
    transaction: Omit<Transaction, 'id'>,
    opts?: { createRecurringTemplate?: CreateRecurringTemplateInput }
  ) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  copyFrom,
  onSave,
  onClose,
}) => {
  const { categories } = useCategories();
  const { addToast } = useToast();

  const expenseOptions = useMemo(() => {
    const fromDb = categories
      .filter((c) => c.kind === TransactionType.EXPENSE)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((c) => c.name);
    return fromDb.length ? fromDb : EXPENSE_CATEGORIES;
  }, [categories]);

  const incomeOptions = useMemo(() => {
    const fromDb = categories
      .filter((c) => c.kind === TransactionType.INCOME)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((c) => c.name);
    return fromDb.length ? fromDb : INCOME_CATEGORIES;
  }, [categories]);

  const [type, setType] = useState<TransactionType>(transaction?.type || TransactionType.EXPENSE);
  const [currency, setCurrency] = useState<Currency>(transaction?.currency || 'ILS');
  const [amount, setAmount] = useState<string>(transaction?.amount.toString() || '');
  const [description, setDescription] = useState(transaction?.description || '');
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(transaction?.category || EXPENSE_CATEGORIES[0]);
  
  // Logic Flags
  const [isRecurring, setIsRecurring] = useState(transaction?.isRecurring || copyFrom?.isRecurring || false);
  const [recurringMaxRemaining, setRecurringMaxRemaining] = useState('');
  
  // Expense Classification helper
  const getExpenseClass = (tx?: Transaction): 'household' | 'maaser_deductible' | 'tax_deductible' | 'investment' | 'tax_savings' | 'maaser_payment' => {
    if (!tx) return 'household';
    if (tx.isMaaserPayment) return 'maaser_payment';
    if (tx.isMaaserDeductible) return 'maaser_deductible';
    if (tx.isTaxDeductible) return 'tax_deductible';
    if (tx.isInvestment) return 'investment';
    if (tx.isTaxSavings) return 'tax_savings';
    return 'household';
  };
  const [expenseClass, setExpenseClass] = useState<'household' | 'maaser_deductible' | 'tax_deductible' | 'investment' | 'tax_savings' | 'maaser_payment'>(getExpenseClass(transaction));
  /** Income is Ma'aser-able by default; when true, exclude this income from Ma'aser obligation. */
  const [excludeFromMaaserIncome, setExcludeFromMaaserIncome] = useState(
    () => !!(transaction?.isNonMaaserIncome || copyFrom?.isNonMaaserIncome)
  );

  // Update form when transaction / copy source changes
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setCurrency(transaction.currency);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description);
      setDate(transaction.date);
      setCategory(transaction.category);
      setIsRecurring(transaction.isRecurring || false);
      setRecurringMaxRemaining(
        transaction.recurringRemainingPayments != null
          ? String(transaction.recurringRemainingPayments)
          : ''
      );
      let newExpenseClass: 'household' | 'maaser_deductible' | 'tax_deductible' | 'investment' | 'tax_savings' | 'maaser_payment' = 'household';
      if (transaction.isMaaserPayment) newExpenseClass = 'maaser_payment';
      else if (transaction.isMaaserDeductible) newExpenseClass = 'maaser_deductible';
      else if (transaction.isTaxDeductible) newExpenseClass = 'tax_deductible';
      else if (transaction.isInvestment) newExpenseClass = 'investment';
      else if (transaction.isTaxSavings) newExpenseClass = 'tax_savings';
      setExpenseClass(newExpenseClass);
      setExcludeFromMaaserIncome(!!transaction.isNonMaaserIncome);
    } else if (copyFrom) {
      setType(copyFrom.type);
      setCurrency(copyFrom.currency);
      setAmount(copyFrom.amount.toString());
      setDescription(copyFrom.description);
      setDate(new Date().toISOString().split('T')[0]);
      setCategory(copyFrom.category);
      setIsRecurring(copyFrom.isRecurring || false);
      setRecurringMaxRemaining(
        copyFrom.recurringRemainingPayments != null
          ? String(copyFrom.recurringRemainingPayments)
          : ''
      );
      let newExpenseClass: 'household' | 'maaser_deductible' | 'tax_deductible' | 'investment' | 'tax_savings' | 'maaser_payment' = 'household';
      if (copyFrom.isMaaserPayment) newExpenseClass = 'maaser_payment';
      else if (copyFrom.isMaaserDeductible) newExpenseClass = 'maaser_deductible';
      else if (copyFrom.isTaxDeductible) newExpenseClass = 'tax_deductible';
      else if (copyFrom.isInvestment) newExpenseClass = 'investment';
      else if (copyFrom.isTaxSavings) newExpenseClass = 'tax_savings';
      setExpenseClass(newExpenseClass);
      setExcludeFromMaaserIncome(!!copyFrom.isNonMaaserIncome);
    } else {
      setType(TransactionType.EXPENSE);
      setCurrency('ILS');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory(EXPENSE_CATEGORIES[0]);
      setIsRecurring(false);
      setRecurringMaxRemaining('');
      setExpenseClass('household');
      setExcludeFromMaaserIncome(false);
    }
  }, [transaction, copyFrom]);

  const optionsForType = type === TransactionType.EXPENSE ? expenseOptions : incomeOptions;

  useEffect(() => {
    if (!optionsForType.length) return;
    const source = transaction ?? copyFrom;
    const holdingLegacySavedLabel =
      !!source && category === source.category && !optionsForType.includes(category);
    if (holdingLegacySavedLabel) return;
    if (!optionsForType.includes(category)) {
      setCategory(optionsForType[0]);
    }
  }, [type, optionsForType, category, transaction, copyFrom]);

  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!transaction;
  const isLinkedToTemplate = !!transaction?.recurringTemplateId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Map classification to boolean flags
    const isMaaserDeductible = type === TransactionType.EXPENSE && expenseClass === 'maaser_deductible';
    const isTaxDeductible = type === TransactionType.EXPENSE && expenseClass === 'tax_deductible';
    const isInvestment = type === TransactionType.EXPENSE && expenseClass === 'investment';
    const isTaxSavings = type === TransactionType.EXPENSE && expenseClass === 'tax_savings';
    const isMaaserPayment = type === TransactionType.EXPENSE && expenseClass === 'maaser_payment';
    const isNonMaaserIncome =
      type === TransactionType.INCOME && excludeFromMaaserIncome;
    const effectiveRecurring = type === TransactionType.EXPENSE && isRecurring;

    let totalPaymentsCap: number | null = null;
    if (effectiveRecurring) {
      const trimmed = recurringMaxRemaining.trim();
      if (trimmed !== '') {
        const n = Number.parseInt(trimmed, 10);
        totalPaymentsCap = Number.isNaN(n) || n < 0 ? null : n;
      }
    }

    // Recurring template creation only happens for brand-new EXPENSE rows when user ticks the box.
    // When editing an existing row, the recurring controls are read-only/info-only and we don't
    // mutate the template here (template management is on the Recurring page).
    const shouldCreateTemplate = !isEditing && effectiveRecurring;

    const payload: Omit<Transaction, 'id'> = {
      date,
      description,
      amount: parseFloat(amount),
      category,
      type,
      currency,
      isRecurring: effectiveRecurring,
      isMaaserDeductible,
      isTaxDeductible,
      isInvestment,
      isTaxSavings,
      isMaaserPayment,
      isNonMaaserIncome,
      recurringCancelledAt: effectiveRecurring ? (transaction?.recurringCancelledAt ?? null) : null,
      // The per-transaction remaining count is legacy; it now lives on the template.
      // Keep null on new rows (template carries the cap) and preserve existing edits.
      recurringRemainingPayments: isEditing ? (transaction?.recurringRemainingPayments ?? null) : null,
    };

    let opts: { createRecurringTemplate?: CreateRecurringTemplateInput } | undefined;
    if (shouldCreateTemplate) {
      const dayParsed = parseInt(date.split('-')[2] ?? '1', 10);
      const dayOfMonth = Math.min(28, Math.max(1, Number.isNaN(dayParsed) ? 1 : dayParsed));
      opts = {
        createRecurringTemplate: {
          dayOfMonth,
          startMonth: date.slice(0, 7),
          totalPaymentsCap,
        },
      };
    }

    onSave(payload, opts);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];
        
        const data: ReceiptData = await parseReceiptImage(base64Content);
        
        if (data.totalAmount) setAmount(data.totalAmount.toString());
        if (data.merchant) setDescription(data.merchant);
        if (data.date) setDate(data.date);
        if (data.currency) setCurrency(data.currency);
        if (data.category && expenseOptions.includes(data.category)) {
          setCategory(data.category);
          setType(TransactionType.EXPENSE);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      addToast('Failed to scan receipt. Please enter details manually.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-black/50 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-start justify-center py-4 sm:items-center sm:py-8">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[min(calc(100dvh-2rem),48rem)] sm:max-h-[90vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transaction-form-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 pt-4 pb-3 rounded-t-2xl">
            <h2 id="transaction-form-title" className="text-xl font-bold text-gray-800 dark:text-gray-50 pr-2">
              {transaction ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4">
        {/* AI Receipt Scan */}
        <div className="mb-6">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-600 dark:text-indigo-300 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors disabled:opacity-70"
          >
            {isScanning ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Scanning Receipt...
              </>
            ) : (
              <>
                <Camera size={20} />
                Scan Receipt with AI
              </>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <button
              type="button"
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => {
                setType(TransactionType.EXPENSE);
                setExcludeFromMaaserIncome(false);
                setCategory(expenseOptions[0] ?? EXPENSE_CATEGORIES[0]);
              }}
            >
              Expense
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => {
                setType(TransactionType.INCOME);
                const src = transaction ?? copyFrom;
                if (src?.type === TransactionType.INCOME) {
                  setExcludeFromMaaserIncome(!!src.isNonMaaserIncome);
                } else {
                  setExcludeFromMaaserIncome(false);
                }
                setCategory(incomeOptions[0] ?? INCOME_CATEGORIES[0]);
              }}
            >
              Income
            </button>
          </div>

          {/* Currency Selector */}
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
             <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrency('ILS')}
                  className={`flex-1 py-2 border rounded-lg font-medium transition-colors ${currency === 'ILS' ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  ₪ Shekels
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`flex-1 py-2 border rounded-lg font-medium transition-colors ${currency === 'USD' ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  $ Dollars
                </button>
             </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                {currency === 'ILS' ? '₪' : '$'}
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder={type === TransactionType.INCOME ? "e.g. Salary, Gift" : "e.g. Monthly Mortgage, Utilities"}
            />
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                {(transaction ?? copyFrom) && !optionsForType.includes(category) && (
                  <option value={category}>{category} (saved label)</option>
                )}
                {optionsForType.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {type === TransactionType.INCOME && (
            <div className="flex items-start gap-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-3">
              <input
                type="checkbox"
                id="exclude-maaser-income"
                checked={excludeFromMaaserIncome}
                onChange={(e) => setExcludeFromMaaserIncome(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-900 dark:focus:ring-offset-gray-800"
              />
              <label htmlFor="exclude-maaser-income" className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                Exclude from Ma&apos;aser obligation <span className="text-gray-500 dark:text-gray-400">(loan, reimbursement, etc.)</span>
              </label>
            </div>
          )}

          {/* Expense Classification */}
          {type === TransactionType.EXPENSE && (
             <div className="space-y-4 pt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expense Type</label>
                <div className="space-y-2">
                   <div className="flex items-center">
                      <input 
                         type="radio" 
                         id="household"
                         name="expenseClass"
                         checked={expenseClass === 'household'}
                         onChange={() => setExpenseClass('household')}
                         className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="household" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Household (Regular Budget)</label>
                   </div>
                   
                   <div className="flex items-center">
                      <input 
                         type="radio" 
                         id="maaser_deductible"
                         name="expenseClass"
                         checked={expenseClass === 'maaser_deductible'}
                         onChange={() => setExpenseClass('maaser_deductible')}
                         className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="maaser_deductible" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Business Exp (Deduct from Ma'aser)</label>
                   </div>

                   <div className="flex items-center">
                      <input 
                         type="radio" 
                         id="tax_deductible"
                         name="expenseClass"
                         checked={expenseClass === 'tax_deductible'}
                         onChange={() => setExpenseClass('tax_deductible')}
                         className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="tax_deductible" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Business Exp (Tax Only - No Ma'aser effect)</label>
                   </div>

                   <div className="flex items-center">
                      <input 
                         type="radio" 
                         id="investment"
                         name="expenseClass"
                         checked={expenseClass === 'investment'}
                         onChange={() => setExpenseClass('investment')}
                         className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="investment" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Investment Deposit</label>
                   </div>

                   <div className="flex items-center">
                      <input 
                         type="radio" 
                         id="tax_savings"
                         name="expenseClass"
                         checked={expenseClass === 'tax_savings'}
                         onChange={() => setExpenseClass('tax_savings')}
                         className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="tax_savings" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Tax Savings Deposit</label>
                   </div>

                   <div className="flex items-center">
                      <input 
                         type="radio" 
                         id="maaser_payment"
                         name="expenseClass"
                         checked={expenseClass === 'maaser_payment'}
                         onChange={() => setExpenseClass('maaser_payment')}
                         className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="maaser_payment" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Ma'aser Payment (Charity)</label>
                   </div>
                </div>

                {isLinkedToTemplate ? (
                  <div className="mt-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-lg p-3 flex items-start gap-2">
                    <RefreshCw size={16} className="text-indigo-600 mt-0.5 shrink-0" aria-hidden />
                    <div className="text-xs text-indigo-900 dark:text-indigo-200">
                      <p className="font-semibold">Generated from a recurring template.</p>
                      <p className="mt-1 text-indigo-800 dark:text-indigo-300">
                        Edits here only change this single row. Manage the schedule (cancel, edit
                        amount for future months) from the <span className="font-medium">Recurring</span> page.
                      </p>
                    </div>
                  </div>
                ) : isEditing ? (
                  // Editing a legacy / non-template row: don't expose template controls; just preserve isRecurring flag.
                  <div className="flex items-center mt-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Monthly Recurring Bill
                    </label>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center mt-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      <input
                        type="checkbox"
                        id="isRecurring"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Monthly Recurring Bill
                      </label>
                    </div>
                    {isRecurring && (
                      <div className="mt-3 space-y-2">
                        <label htmlFor="recurringMaxRemaining" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Total payments
                        </label>
                        <input
                          id="recurringMaxRemaining"
                          type="number"
                          min={0}
                          step={1}
                          value={recurringMaxRemaining}
                          onChange={(e) => setRecurringMaxRemaining(e.target.value)}
                          placeholder="Unlimited if empty"
                          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Total includes this payment. Leave blank for no limit. A new transaction
                          will auto-generate on day {parseInt(date.split('-')[2] ?? '1', 10)} of every
                          month from {date.slice(0, 7)} onwards.
                        </p>
                      </div>
                    )}
                  </>
                )}
             </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition-colors mt-6"
          >
            {transaction ? 'Update Transaction' : 'Save Transaction'}
          </button>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
};
