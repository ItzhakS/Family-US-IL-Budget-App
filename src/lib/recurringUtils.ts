import { RecurringTemplate, Transaction, TransactionType } from '../types';

/** Recurring tab: expense rows that are still active (not cancelled, not exhausted). */
export function isActiveRecurringListRow(t: Transaction): boolean {
  if (t.type !== TransactionType.EXPENSE || !t.isRecurring) return false;
  if (t.recurringCancelledAt) return false;
  if (t.recurringRemainingPayments != null && t.recurringRemainingPayments <= 0) return false;
  return true;
}

export function omitTransactionId(tx: Transaction): Omit<Transaction, 'id'> {
  const { id: _id, ...rest } = tx;
  return rest;
}

/** True when the template should still produce future transactions. */
export function isTemplateActive(t: RecurringTemplate): boolean {
  if (t.cancelledAt) return false;
  if (t.remainingPayments != null && t.remainingPayments <= 0) return false;
  return true;
}

/** Current calendar month in `YYYY-MM` (browser local). */
export function currentYearMonth(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Add `delta` months to a `YYYY-MM` string. Negative deltas allowed. */
export function addMonths(yyyymm: string, delta: number): string {
  const [yStr, mStr] = yyyymm.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(y) || Number.isNaN(m)) return yyyymm;
  // Convert to absolute month index, add, convert back. month is 1-12 here.
  const abs = y * 12 + (m - 1) + delta;
  const newY = Math.floor(abs / 12);
  const newM = (abs % 12) + 1;
  return `${newY}-${String(newM).padStart(2, '0')}`;
}

/** Inclusive list of months in `[start, end]`. Returns [] when start > end. */
export function monthRangeInclusive(start: string, end: string): string[] {
  if (start > end) return [];
  const out: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    out.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return out;
}

/** Build a `YYYY-MM-DD` for a given month + day (day capped to 1..28). */
export function dateForMonth(yyyymm: string, dayOfMonth: number): string {
  const day = Math.min(28, Math.max(1, Math.floor(dayOfMonth || 1)));
  return `${yyyymm}-${String(day).padStart(2, '0')}`;
}

/** Extract `YYYY-MM` from a `YYYY-MM-DD` string. */
export function monthOfDate(date: string): string {
  return date.slice(0, 7);
}
