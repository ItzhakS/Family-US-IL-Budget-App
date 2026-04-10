import type { Currency, Transaction } from '../types';
import type { ExchangeRate } from '../services/exchangeRateService';

function validUsdToIls(v: unknown): number | null {
  if (v == null || typeof v !== 'number' || Number.isNaN(v) || v <= 0) return null;
  return v;
}

/** YYYY-MM from transaction date (local calendar, same as list filters). */
export function transactionMonthKey(tx: Transaction): string {
  return tx.date.slice(0, 7);
}

/**
 * For each calendar month, average `exchangeRateUsdToIls` over transactions that have a snapshot.
 * Used when a row’s FX is null: fall back to “typical” rate for that month from other rows.
 */
export function buildMonthAverageUsdToIls(transactions: Transaction[]): Map<string, number> {
  const buckets = new Map<string, number[]>();
  for (const t of transactions) {
    const r = validUsdToIls(t.exchangeRateUsdToIls);
    if (r == null) continue;
    const key = transactionMonthKey(t);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r);
  }
  const out = new Map<string, number>();
  for (const [key, vals] of buckets) {
    out.set(key, vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  return out;
}

/**
 * Resolve 1 USD = X ILS for converting this row: own snapshot → same-month average → today’s global rate.
 */
export function resolveUsdToIlsForTransaction(
  tx: Transaction,
  monthAverages: Map<string, number>,
  globalRate: ExchangeRate | null
): number | null {
  const own = validUsdToIls(tx.exchangeRateUsdToIls);
  if (own != null) return own;

  const monthAvg = monthAverages.get(transactionMonthKey(tx));
  if (monthAvg != null && monthAvg > 0) return monthAvg;

  const g = globalRate?.usdToIls;
  if (g != null && !Number.isNaN(g) && g > 0) return g;

  return null;
}

export function convertAmountBetweenCurrencies(
  amount: number,
  from: Currency,
  to: Currency,
  usdToIls: number
): number {
  if (from === to) return amount;
  if (!Number.isFinite(usdToIls) || usdToIls <= 0) return amount;
  if (from === 'USD' && to === 'ILS') return amount * usdToIls;
  if (from === 'ILS' && to === 'USD') return amount / usdToIls;
  return amount;
}

/**
 * Sum transaction amounts expressed in `targetCurrency`, converting each row with its resolved rate.
 * Rows already in `targetCurrency` are added verbatim. Cross-currency rows need a resolvable rate or the
 * function returns null (caller may treat as 0).
 */
export function sumTransactionsAsCurrency(
  transactions: Transaction[],
  targetCurrency: Currency,
  universeForFallbacks: Transaction[],
  globalRate: ExchangeRate | null
): number | null {
  const monthAvgs = buildMonthAverageUsdToIls(universeForFallbacks);
  let sum = 0;
  for (const tx of transactions) {
    if (tx.currency === targetCurrency) {
      sum += tx.amount;
      continue;
    }
    const usdToIls = resolveUsdToIlsForTransaction(tx, monthAvgs, globalRate);
    if (usdToIls == null) return null;
    sum += convertAmountBetweenCurrencies(tx.amount, tx.currency, targetCurrency, usdToIls);
  }
  return sum;
}
