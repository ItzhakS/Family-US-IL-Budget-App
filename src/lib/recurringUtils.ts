import { Transaction, TransactionType } from '../types';

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
