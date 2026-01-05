import React, { useState, useRef } from 'react';
import { Transaction, TransactionType, ReceiptData, Currency } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';
import { X, Loader2, Camera } from 'lucide-react';
import { parseReceiptImage } from '../services/geminiService';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSave, onClose }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [currency, setCurrency] = useState<Currency>('ILS');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  
  // Logic Flags
  const [isRecurring, setIsRecurring] = useState(false);
  
  // Expense Classification
  const [expenseClass, setExpenseClass] = useState<'household' | 'maaser_deductible' | 'tax_deductible' | 'investment' | 'maaser_payment'>('household');

  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Map classification to boolean flags
    const isMaaserDeductible = type === TransactionType.EXPENSE && expenseClass === 'maaser_deductible';
    const isTaxDeductible = type === TransactionType.EXPENSE && expenseClass === 'tax_deductible';
    const isInvestment = type === TransactionType.EXPENSE && expenseClass === 'investment';
    const isMaaserPayment = type === TransactionType.EXPENSE && expenseClass === 'maaser_payment';

    onSave({
      date,
      description,
      amount: parseFloat(amount),
      category,
      type,
      currency,
      isRecurring,
      isMaaserDeductible,
      isTaxDeductible,
      isInvestment,
      isMaaserPayment
    });
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
        if (data.category && EXPENSE_CATEGORIES.includes(data.category)) {
          setCategory(data.category);
          setType(TransactionType.EXPENSE);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert("Failed to scan receipt. Please enter details manually.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-xl my-8">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-xl font-bold mb-6 text-gray-800">Add Transaction</h2>

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
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-600 font-medium hover:bg-indigo-50 transition-colors disabled:opacity-70"
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
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
              onClick={() => {
                setType(TransactionType.EXPENSE);
                setCategory(EXPENSE_CATEGORIES[0]);
              }}
            >
              Expense
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === TransactionType.INCOME ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
              onClick={() => {
                setType(TransactionType.INCOME);
                setCategory(INCOME_CATEGORIES[0]);
              }}
            >
              Income
            </button>
          </div>

          {/* Currency Selector */}
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
             <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrency('ILS')}
                  className={`flex-1 py-2 border rounded-lg font-medium transition-colors ${currency === 'ILS' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  ₪ Shekels
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`flex-1 py-2 border rounded-lg font-medium transition-colors ${currency === 'USD' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  $ Dollars
                </button>
             </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {currency === 'ILS' ? '₪' : '$'}
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder={type === TransactionType.INCOME ? "e.g. Salary, Gift" : "e.g. Monthly Mortgage, Utilities"}
            />
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
              >
                {(type === TransactionType.EXPENSE ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Expense Classification */}
          {type === TransactionType.EXPENSE && (
             <div className="space-y-4 pt-2">
                <label className="block text-sm font-medium text-gray-700">Expense Type</label>
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
                      <label htmlFor="household" className="ml-2 text-sm text-gray-700">Household (Regular Budget)</label>
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
                      <label htmlFor="maaser_deductible" className="ml-2 text-sm text-gray-700">Business Exp (Deduct from Ma'aser)</label>
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
                      <label htmlFor="tax_deductible" className="ml-2 text-sm text-gray-700">Business Exp (Tax Only - No Ma'aser effect)</label>
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
                      <label htmlFor="investment" className="ml-2 text-sm text-gray-700">Investment / Tax Saving Deposit</label>
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
                      <label htmlFor="maaser_payment" className="ml-2 text-sm text-gray-700">Ma'aser Payment (Charity)</label>
                   </div>
                </div>

                {expenseClass === 'household' && (
                  <div className="flex items-center mt-3 bg-gray-50 p-3 rounded-lg">
                    <input 
                        type="checkbox" 
                        id="isRecurring"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-700">Monthly Recurring Bill</label>
                  </div>
                )}
             </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors mt-6"
          >
            Save Transaction
          </button>
        </form>
      </div>
    </div>
  );
};
