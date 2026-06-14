import type { Currency, MaaserMonthStats, MaaserOffsetFxSlice, Transaction } from '../types';
import { TransactionType } from '../types';
import type { ExchangeRate } from '../services/exchangeRateService';
import {
  buildMonthAverageUsdToIls,
  convertAmountBetweenCurrencies,
  transactionMonthKey,
} from './transactionFx';

export interface MaaserCreditBucket {
  month: string;
  creditAmount: number;
  avgRateUsdToIls: number;
}

export interface CrossCurrencyOffsetResult {
  creditLegAmount: number;
  debtLegAmount: number;
  effectiveRateUsdToIls: number;
  bucketBreakdown: MaaserOffsetFxSlice[];
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function monthKeyFromDate(date: string): string {
  return date.slice(0, 7);
}

function charityPaidInMonth(monthTx: Transaction[]): number {
  return monthTx
    .filter(
      (t) =>
        t.type === TransactionType.EXPENSE &&
        t.isMaaserPayment &&
        !t.isMaaserCrossCurrencyCredit
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

function creditAppliedInMonth(monthTx: Transaction[]): number {
  return monthTx
    .filter((t) => t.isMaaserCrossCurrencyCredit)
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Chronological monthly ma'aser stats for one currency (oldest first). */
export function computeMaaserMonthlyStats(
  transactions: Transaction[],
  currency: Currency
): MaaserMonthStats[] {
  const grouped: Record<string, Transaction[]> = {};
  const allMonths = new Set<string>();

  transactions
    .filter((t) => t.currency === currency)
    .forEach((t) => {
      const monthKey = monthKeyFromDate(t.date);
      allMonths.add(monthKey);
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(t);
    });

  const sortedMonths = Array.from(allMonths).sort();
  const stats: MaaserMonthStats[] = [];
  let runningBalance = 0;

  sortedMonths.forEach((month) => {
    const monthTx = grouped[month];

    const income = monthTx
      .filter((t) => t.type === TransactionType.INCOME && !t.isNonMaaserIncome)
      .reduce((sum, t) => sum + t.amount, 0);

    const deductibleTx = monthTx.filter(
      (t) => t.type === TransactionType.EXPENSE && t.isMaaserDeductible
    );
    const deductions = deductibleTx.reduce((sum, t) => sum + t.amount, 0);
    const netProfit = income - deductions;
    const obligation = Math.max(0, netProfit * 0.1);
    const paid = charityPaidInMonth(monthTx);
    const creditApplied = creditAppliedInMonth(monthTx);
    const monthlyBalance = obligation - paid + creditApplied;
    runningBalance += monthlyBalance;

    stats.push({
      month,
      income,
      deductions,
      deductibleTransactions: deductibleTx,
      netProfit,
      obligation,
      paid,
      monthlyBalance,
      runningBalance,
    });
  });

  return stats;
}

/** Newest-first monthly stats (for UI tables). */
export function computeMaaserMonthlyStatsNewestFirst(
  transactions: Transaction[],
  currency: Currency
): MaaserMonthStats[] {
  return [...computeMaaserMonthlyStats(transactions, currency)].reverse();
}

export function getMaaserRunningBalance(
  transactions: Transaction[],
  currency: Currency
): number {
  const stats = computeMaaserMonthlyStats(transactions, currency);
  if (stats.length === 0) return 0;
  return stats[stats.length - 1].runningBalance;
}

function resolveMonthRate(
  month: string,
  currencyTransactions: Transaction[],
  allTransactions: Transaction[],
  globalRate: ExchangeRate | null
): number {
  const monthAvgs = buildMonthAverageUsdToIls(allTransactions);
  const fromMonth = monthAvgs.get(month);
  if (fromMonth != null && fromMonth > 0) return fromMonth;

  const inMonth = currencyTransactions.filter((t) => transactionMonthKey(t) === month);
  for (const t of inMonth) {
    const r = t.exchangeRateUsdToIls;
    if (r != null && !Number.isNaN(r) && r > 0) return r;
  }

  const g = globalRate?.usdToIls;
  if (g != null && !Number.isNaN(g) && g > 0) return g;

  return 3.7;
}

/**
 * FIFO credit buckets remaining after prior cross-currency offsets.
 */
export function buildMaaserCreditBuckets(
  transactions: Transaction[],
  currency: Currency,
  globalRate: ExchangeRate | null
): MaaserCreditBucket[] {
  const currencyTx = transactions.filter((t) => t.currency === currency);
  const stats = computeMaaserMonthlyStats(transactions, currency);

  const buckets: MaaserCreditBucket[] = [];
  for (const stat of stats) {
    if (stat.monthlyBalance < 0) {
      buckets.push({
        month: stat.month,
        creditAmount: roundMoney(-stat.monthlyBalance),
        avgRateUsdToIls: resolveMonthRate(
          stat.month,
          currencyTx,
          transactions,
          globalRate
        ),
      });
    }
  }

  const creditLegs = transactions
    .filter((t) => t.currency === currency && t.isMaaserCrossCurrencyCredit)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  for (const leg of creditLegs) {
    let remaining = leg.amount;
    for (const bucket of buckets) {
      if (remaining <= 0) break;
      if (bucket.creditAmount <= 0) continue;
      const take = Math.min(bucket.creditAmount, remaining);
      bucket.creditAmount = roundMoney(bucket.creditAmount - take);
      remaining = roundMoney(remaining - take);
    }
  }

  return buckets.filter((b) => b.creditAmount > 0.001);
}

export function getAvailableMaaserCredit(
  transactions: Transaction[],
  currency: Currency,
  globalRate: ExchangeRate | null
): number {
  const buckets = buildMaaserCreditBuckets(transactions, currency, globalRate);
  return roundMoney(buckets.reduce((s, b) => s + b.creditAmount, 0));
}

export interface ComputeOffsetInput {
  creditCurrency: Currency;
  debtCurrency: Currency;
  amount: number;
  amountSide: 'credit' | 'debt';
  buckets: MaaserCreditBucket[];
  debtOwed: number;
}

function sliceBucket(
  bucket: MaaserCreditBucket,
  creditCurrency: Currency,
  debtCurrency: Currency,
  opts: { maxCredit?: number; maxDebt?: number }
): { creditSlice: number; debtSlice: number } | null {
  const rate = bucket.avgRateUsdToIls;
  if (rate <= 0 || bucket.creditAmount <= 0) return null;

  let creditSlice = bucket.creditAmount;
  let debtSlice: number;

  if (creditCurrency === 'ILS' && debtCurrency === 'USD') {
    debtSlice = creditSlice / rate;
    if (opts.maxDebt != null) {
      if (debtSlice > opts.maxDebt) {
        debtSlice = opts.maxDebt;
        creditSlice = debtSlice * rate;
      }
    }
    if (opts.maxCredit != null && creditSlice > opts.maxCredit) {
      creditSlice = opts.maxCredit;
      debtSlice = creditSlice / rate;
    }
  } else if (creditCurrency === 'USD' && debtCurrency === 'ILS') {
    debtSlice = creditSlice * rate;
    if (opts.maxDebt != null && debtSlice > opts.maxDebt) {
      debtSlice = opts.maxDebt;
      creditSlice = debtSlice / rate;
    }
    if (opts.maxCredit != null && creditSlice > opts.maxCredit) {
      creditSlice = opts.maxCredit;
      debtSlice = creditSlice * rate;
    }
  } else {
    return null;
  }

  creditSlice = roundMoney(Math.min(creditSlice, bucket.creditAmount));
  if (creditCurrency === 'ILS' && debtCurrency === 'USD') {
    debtSlice = roundMoney(creditSlice / rate);
  } else {
    debtSlice = roundMoney(creditSlice * rate);
  }

  if (creditSlice <= 0 || debtSlice <= 0) return null;
  return { creditSlice, debtSlice };
}

export function computeCrossCurrencyOffsetAmounts(
  input: ComputeOffsetInput
): CrossCurrencyOffsetResult | null {
  const { creditCurrency, debtCurrency, amount, amountSide, buckets, debtOwed } = input;
  if (amount <= 0 || debtOwed <= 0) return null;

  const availableCredit = buckets.reduce((s, b) => s + b.creditAmount, 0);
  if (availableCredit <= 0) return null;

  const workingBuckets = buckets.map((b) => ({ ...b }));
  const breakdown: MaaserOffsetFxSlice[] = [];
  let creditLegAmount = 0;
  let debtLegAmount = 0;

  if (amountSide === 'debt') {
    let debtRemaining = roundMoney(Math.min(amount, debtOwed));

    for (const bucket of workingBuckets) {
      if (debtRemaining <= 0.001) break;
      const sliced = sliceBucket(bucket, creditCurrency, debtCurrency, {
        maxDebt: debtRemaining,
      });
      if (!sliced) continue;

      bucket.creditAmount = roundMoney(bucket.creditAmount - sliced.creditSlice);
      debtRemaining = roundMoney(debtRemaining - sliced.debtSlice);
      creditLegAmount = roundMoney(creditLegAmount + sliced.creditSlice);
      debtLegAmount = roundMoney(debtLegAmount + sliced.debtSlice);

      breakdown.push({
        month: bucket.month,
        creditAmount: sliced.creditSlice,
        avgRateUsdToIls: bucket.avgRateUsdToIls,
        debtAmount: sliced.debtSlice,
      });
    }
  } else {
    let creditRemaining = roundMoney(Math.min(amount, availableCredit));

    for (const bucket of workingBuckets) {
      if (creditRemaining <= 0.001) break;
      const sliced = sliceBucket(bucket, creditCurrency, debtCurrency, {
        maxCredit: creditRemaining,
      });
      if (!sliced) continue;

      const cappedDebt = roundMoney(Math.min(sliced.debtSlice, debtOwed - debtLegAmount));
      if (cappedDebt <= 0) break;

      let { creditSlice, debtSlice } = sliced;
      if (debtSlice > cappedDebt) {
        debtSlice = cappedDebt;
        const rate = bucket.avgRateUsdToIls;
        creditSlice =
          creditCurrency === 'ILS'
            ? roundMoney(debtSlice * rate)
            : roundMoney(debtSlice / rate);
      }

      bucket.creditAmount = roundMoney(bucket.creditAmount - creditSlice);
      creditRemaining = roundMoney(creditRemaining - creditSlice);
      creditLegAmount = roundMoney(creditLegAmount + creditSlice);
      debtLegAmount = roundMoney(debtLegAmount + debtSlice);

      breakdown.push({
        month: bucket.month,
        creditAmount: creditSlice,
        avgRateUsdToIls: bucket.avgRateUsdToIls,
        debtAmount: debtSlice,
      });
    }
  }

  if (debtLegAmount <= 0 || creditLegAmount <= 0) return null;

  const effectiveRateUsdToIls =
    creditCurrency === 'ILS' && debtCurrency === 'USD'
      ? roundMoney(creditLegAmount / debtLegAmount)
      : roundMoney(debtLegAmount / creditLegAmount);

  return {
    creditLegAmount,
    debtLegAmount,
    effectiveRateUsdToIls,
    bucketBreakdown: breakdown,
  };
}

export function convertMaaserDebtToCreditCurrency(
  debtAmount: number,
  debtCurrency: Currency,
  creditCurrency: Currency,
  usdToIls: number
): number {
  return convertAmountBetweenCurrencies(
    debtAmount,
    debtCurrency,
    creditCurrency,
    usdToIls
  );
}

export function canCrossCurrencyOffset(
  transactions: Transaction[],
  globalRate: ExchangeRate | null
): { creditCurrency: Currency; debtCurrency: Currency } | null {
  const ilsBalance = getMaaserRunningBalance(transactions, 'ILS');
  const usdBalance = getMaaserRunningBalance(transactions, 'USD');

  if (ilsBalance < 0 && usdBalance > 0) {
    const credit = getAvailableMaaserCredit(transactions, 'ILS', globalRate);
    if (credit > 0) return { creditCurrency: 'ILS', debtCurrency: 'USD' };
  }
  if (usdBalance < 0 && ilsBalance > 0) {
    const credit = getAvailableMaaserCredit(transactions, 'USD', globalRate);
    if (credit > 0) return { creditCurrency: 'USD', debtCurrency: 'ILS' };
  }
  return null;
}

export function computeMaxCrossCurrencyOffset(
  transactions: Transaction[],
  creditCurrency: Currency,
  debtCurrency: Currency,
  globalRate: ExchangeRate | null
): CrossCurrencyOffsetResult | null {
  const debtOwed = getMaaserRunningBalance(transactions, debtCurrency);
  if (debtOwed <= 0) return null;

  const buckets = buildMaaserCreditBuckets(transactions, creditCurrency, globalRate);
  const availableCredit = buckets.reduce((s, b) => s + b.creditAmount, 0);
  if (availableCredit <= 0) return null;

  const avgRate =
    buckets.reduce((s, b) => s + b.avgRateUsdToIls * b.creditAmount, 0) /
      availableCredit || globalRate?.usdToIls || 3.7;

  const debtInCredit = convertMaaserDebtToCreditCurrency(
    debtOwed,
    debtCurrency,
    creditCurrency,
    avgRate
  );

  if (debtInCredit <= availableCredit) {
    return computeCrossCurrencyOffsetAmounts({
      creditCurrency,
      debtCurrency,
      amount: debtOwed,
      amountSide: 'debt',
      buckets,
      debtOwed,
    });
  }

  return computeCrossCurrencyOffsetAmounts({
    creditCurrency,
    debtCurrency,
    amount: availableCredit,
    amountSide: 'credit',
    buckets,
    debtOwed,
  });
}
