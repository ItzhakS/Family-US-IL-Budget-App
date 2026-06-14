import { describe, it, expect } from 'vitest';
import { TransactionType, type Transaction } from '../types';
import {
  buildMaaserCreditBuckets,
  computeCrossCurrencyOffsetAmounts,
  computeMaaserMonthlyStats,
  getMaaserRunningBalance,
  getAvailableMaaserCredit,
} from './maaserCalculations';

const globalRate = { usdToIls: 3.6, ilsToUsd: 1 / 3.6, date: '2024-06-01' };

function income(
  id: string,
  date: string,
  amount: number,
  currency: 'ILS' | 'USD' = 'ILS',
  rate?: number
): Transaction {
  return {
    id,
    date,
    description: 'Income',
    amount,
    category: 'Salary',
    type: TransactionType.INCOME,
    currency,
    exchangeRateUsdToIls: rate ?? 3.6,
    fxRateDate: date,
  };
}

function maaserPayment(
  id: string,
  date: string,
  amount: number,
  currency: 'ILS' | 'USD' = 'ILS'
): Transaction {
  return {
    id,
    date,
    description: 'Charity',
    amount,
    category: 'Charity',
    type: TransactionType.EXPENSE,
    currency,
    isMaaserPayment: true,
  };
}

function crossCreditLeg(
  id: string,
  date: string,
  amount: number,
  currency: 'ILS' | 'USD',
  pairId: string
): Transaction {
  return {
    id,
    date,
    description: 'Offset credit',
    amount,
    category: 'Charity',
    type: TransactionType.EXPENSE,
    currency,
    isMaaserCrossCurrencyCredit: true,
    maaserOffsetPairId: pairId,
  };
}

describe('maaserCalculations', () => {
  it('computes running balance with credit applied offset leg', () => {
    const txs: Transaction[] = [
      income('1', '2024-03-01', 10000, 'ILS'),
      maaserPayment('2', '2024-03-15', 1500, 'ILS'),
      crossCreditLeg('3', '2024-04-01', 200, 'ILS', 'pair-1'),
    ];
    const stats = computeMaaserMonthlyStats(txs, 'ILS');
    const mar = stats.find((s) => s.month === '2024-03')!;
    const apr = stats.find((s) => s.month === '2024-04')!;

    expect(mar.obligation).toBe(1000);
    expect(mar.paid).toBe(1500);
    expect(mar.monthlyBalance).toBe(-500);
    expect(apr.monthlyBalance).toBe(200);
    expect(getMaaserRunningBalance(txs, 'ILS')).toBe(-300);
  });

  it('builds FIFO credit buckets from overpaid months', () => {
    const txs: Transaction[] = [
      income('1', '2024-03-01', 10000, 'ILS', 3.55),
      maaserPayment('2', '2024-03-20', 1200, 'ILS'),
      income('3', '2024-04-01', 5000, 'ILS', 3.62),
      maaserPayment('4', '2024-04-20', 800, 'ILS'),
    ];
    const buckets = buildMaaserCreditBuckets(txs, 'ILS', globalRate);
    expect(buckets.length).toBeGreaterThanOrEqual(1);
    const total = buckets.reduce((s, b) => s + b.creditAmount, 0);
    expect(total).toBeCloseTo(300, 0);
  });

  it('consumes buckets FIFO for ILS credit to USD debt', () => {
    const txs: Transaction[] = [
      income('1', '2024-03-01', 10000, 'ILS', 3.6),
      maaserPayment('2', '2024-03-20', 1500, 'ILS'),
      income('3', '2024-04-01', 1000, 'USD'),
    ];
    const buckets = buildMaaserCreditBuckets(txs, 'ILS', globalRate);
    const result = computeCrossCurrencyOffsetAmounts({
      creditCurrency: 'ILS',
      debtCurrency: 'USD',
      amount: 100,
      amountSide: 'debt',
      buckets,
      debtOwed: 100,
    });
    expect(result).not.toBeNull();
    expect(result!.debtLegAmount).toBe(100);
    expect(result!.creditLegAmount).toBe(360);
    expect(result!.effectiveRateUsdToIls).toBe(3.6);
  });

  it('reduces available credit after prior offset legs', () => {
    const txs: Transaction[] = [
      income('1', '2024-03-01', 10000, 'ILS'),
      maaserPayment('2', '2024-03-20', 1500, 'ILS'),
      crossCreditLeg('3', '2024-04-01', 200, 'ILS', 'p1'),
    ];
    expect(getAvailableMaaserCredit(txs, 'ILS', globalRate)).toBe(300);
  });

  it('caps offset at debt owed', () => {
    const txs: Transaction[] = [
      income('1', '2024-03-01', 10000, 'ILS', 3.6),
      maaserPayment('2', '2024-03-20', 2000, 'ILS'),
      income('3', '2024-04-01', 500, 'USD'),
    ];
    const buckets = buildMaaserCreditBuckets(txs, 'ILS', globalRate);
    const result = computeCrossCurrencyOffsetAmounts({
      creditCurrency: 'ILS',
      debtCurrency: 'USD',
      amount: 500,
      amountSide: 'debt',
      buckets,
      debtOwed: 50,
    });
    expect(result!.debtLegAmount).toBe(50);
  });
});
