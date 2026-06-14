import { v4 as uuidv4 } from 'uuid';
import type { Currency, Transaction } from '../types';
import { TransactionType } from '../types';
import type { ExchangeRate } from './exchangeRateService';
import {
  buildMaaserCreditBuckets,
  computeCrossCurrencyOffsetAmounts,
  getMaaserRunningBalance,
  getAvailableMaaserCredit,
} from '../lib/maaserCalculations';
import * as transactionService from './transactionService';

export interface CreateMaaserCrossCurrencyOffsetInput {
  date: string;
  creditCurrency: Currency;
  debtCurrency: Currency;
  amount: number;
  amountSide: 'credit' | 'debt';
  description?: string;
  transactions: Transaction[];
  globalRate: ExchangeRate | null;
}

function sym(c: Currency): string {
  return c === 'ILS' ? '₪' : '$';
}

function defaultDescription(
  creditCurrency: Currency,
  debtCurrency: Currency,
  creditAmount: number,
  debtAmount: number
): string {
  return `Ma'aser offset: ${sym(creditCurrency)}${creditAmount.toLocaleString()} credit → ${sym(debtCurrency)}${debtAmount.toLocaleString()} owed`;
}

export function validateMaaserCrossCurrencyOffset(
  input: CreateMaaserCrossCurrencyOffsetInput
): string | null {
  const { transactions, creditCurrency, debtCurrency, amount, globalRate } = input;

  if (amount <= 0) return 'Amount must be greater than zero.';

  const creditBalance = getMaaserRunningBalance(transactions, creditCurrency);
  const debtBalance = getMaaserRunningBalance(transactions, debtCurrency);

  if (creditBalance >= 0) {
    return `No ma'aser credit available in ${creditCurrency}.`;
  }
  if (debtBalance <= 0) {
    return `No ma'aser debt in ${debtCurrency}.`;
  }

  const availableCredit = getAvailableMaaserCredit(
    transactions,
    creditCurrency,
    globalRate
  );
  if (availableCredit <= 0) {
    return 'No remaining credit to apply (already offset).';
  }

  const buckets = buildMaaserCreditBuckets(transactions, creditCurrency, globalRate);
  const result = computeCrossCurrencyOffsetAmounts({
    creditCurrency,
    debtCurrency,
    amount: input.amount,
    amountSide: input.amountSide,
    buckets,
    debtOwed: debtBalance,
  });

  if (!result) return 'Could not compute offset at this amount.';

  if (result.creditLegAmount > availableCredit + 0.01) {
    return `Amount exceeds available credit (${sym(creditCurrency)}${availableCredit.toLocaleString()}).`;
  }
  if (result.debtLegAmount > debtBalance + 0.01) {
    return `Amount exceeds debt owed (${sym(debtCurrency)}${debtBalance.toLocaleString()}).`;
  }

  return null;
}

export async function createMaaserCrossCurrencyOffset(
  input: CreateMaaserCrossCurrencyOffsetInput
): Promise<{ creditTx: Transaction; debtTx: Transaction }> {
  const validationError = validateMaaserCrossCurrencyOffset(input);
  if (validationError) throw new Error(validationError);

  const { creditCurrency, debtCurrency, transactions, globalRate } = input;
  const debtOwed = getMaaserRunningBalance(transactions, debtCurrency);
  const buckets = buildMaaserCreditBuckets(transactions, creditCurrency, globalRate);

  const computed = computeCrossCurrencyOffsetAmounts({
    creditCurrency,
    debtCurrency,
    amount: input.amount,
    amountSide: input.amountSide,
    buckets,
    debtOwed,
  });

  if (!computed) {
    throw new Error('Could not compute cross-currency offset.');
  }

  const pairId = uuidv4();
  const fxDate = input.date.slice(0, 10);
  const desc =
    input.description ??
    defaultDescription(
      creditCurrency,
      debtCurrency,
      computed.creditLegAmount,
      computed.debtLegAmount
    );

  const creditLeg: Omit<Transaction, 'id'> = {
    date: input.date,
    description: desc,
    amount: computed.creditLegAmount,
    category: 'Charity',
    type: TransactionType.EXPENSE,
    currency: creditCurrency,
    isMaaserCrossCurrencyCredit: true,
    isMaaserPayment: false,
    maaserOffsetPairId: pairId,
    exchangeRateUsdToIls: computed.effectiveRateUsdToIls,
    fxRateDate: fxDate,
  };

  const debtLeg: Omit<Transaction, 'id'> = {
    date: input.date,
    description: desc,
    amount: computed.debtLegAmount,
    category: 'Charity',
    type: TransactionType.EXPENSE,
    currency: debtCurrency,
    isMaaserPayment: true,
    isMaaserCrossCurrencyCredit: false,
    maaserOffsetPairId: pairId,
    maaserOffsetFxBreakdown: computed.bucketBreakdown,
    exchangeRateUsdToIls: computed.effectiveRateUsdToIls,
    fxRateDate: fxDate,
  };

  const [creditTx, debtTx] = await transactionService.bulkCreate([creditLeg, debtLeg]);
  return { creditTx, debtTx };
}

export async function deleteMaaserCrossCurrencyOffsetPair(
  pairId: string
): Promise<void> {
  await transactionService.deleteByMaaserOffsetPairId(pairId);
}
