import { RecurringTemplate, Transaction, TransactionType } from '../types';
import { monthOfDate } from './recurringUtils';

export interface LegacyTemplateSeed {
  template: Omit<RecurringTemplate, 'id' | 'familyId' | 'createdAt' | 'updatedAt'>;
  /** Transaction ids to be linked back to the new template once it is created. */
  transactionIdsToLink: string[];
}

/**
 * Group legacy `isRecurring` transactions (with no `recurringTemplateId`) into
 * synthetic templates so they are visible / editable in the new Recurring page
 * and so future months are auto-generated. The grouping key collapses repeated
 * monthly bills (same description, amount, currency, category, type, expense
 * flags) into a single template.
 *
 * Idempotent: only operates on transactions where `recurringTemplateId` is null.
 * Cancelled or exhausted legacy rows are excluded.
 */
export function buildLegacyTemplateSeeds(
  transactions: Transaction[]
): LegacyTemplateSeed[] {
  const candidates = transactions.filter((t) => {
    if (!t.isRecurring) return false;
    if (t.recurringTemplateId) return false;
    if (t.recurringCancelledAt) return false;
    if (t.recurringRemainingPayments != null && t.recurringRemainingPayments <= 0) return false;
    return true;
  });

  if (candidates.length === 0) return [];

  type Group = {
    sample: Transaction;
    transactions: Transaction[];
  };

  const groups = new Map<string, Group>();

  for (const tx of candidates) {
    const key = JSON.stringify({
      d: tx.description.trim().toLowerCase(),
      a: tx.amount,
      c: tx.category,
      t: tx.type,
      cur: tx.currency,
      md: !!tx.isMaaserDeductible,
      mp: !!tx.isMaaserPayment,
      td: !!tx.isTaxDeductible,
      inv: !!tx.isInvestment,
      ts: !!tx.isTaxSavings,
    });

    const existing = groups.get(key);
    if (existing) {
      existing.transactions.push(tx);
    } else {
      groups.set(key, { sample: tx, transactions: [tx] });
    }
  }

  const seeds: LegacyTemplateSeed[] = [];
  for (const { sample, transactions: groupTxs } of groups.values()) {
    const sortedByDate = [...groupTxs].sort((a, b) => a.date.localeCompare(b.date));
    const earliest = sortedByDate[0];
    const latest = sortedByDate[sortedByDate.length - 1];

    // Day of month: take the day from the earliest transaction's date, capped at 28.
    const dayParsed = parseInt(earliest.date.split('-')[2] ?? '1', 10);
    const dayOfMonth = Math.min(28, Math.max(1, Number.isNaN(dayParsed) ? 1 : dayParsed));

    // Carry over remaining_payments if any of the rows had it (use the latest to reflect current state).
    // Most legacy rows store the same value on every row; pick the smallest non-null as a safe lower bound.
    const remainingValues = groupTxs
      .map((t) => t.recurringRemainingPayments)
      .filter((v): v is number => typeof v === 'number');
    const remainingPayments = remainingValues.length > 0 ? Math.min(...remainingValues) : null;

    seeds.push({
      transactionIdsToLink: groupTxs.map((t) => t.id),
      template: {
        description: sample.description,
        amount: sample.amount,
        category: sample.category,
        type: sample.type,
        currency: sample.currency,
        dayOfMonth,
        isMaaserDeductible: !!sample.isMaaserDeductible,
        isMaaserPayment: !!sample.isMaaserPayment,
        isTaxDeductible: !!sample.isTaxDeductible,
        isInvestment: !!sample.isInvestment,
        isTaxSavings: !!sample.isTaxSavings,
        startMonth: monthOfDate(earliest.date),
        // last_generated_month = latest existing row's month so we don't regenerate it.
        lastGeneratedMonth: monthOfDate(latest.date),
        remainingPayments,
        cancelledAt: null,
      },
    });
  }

  return seeds;
}

/**
 * Income-related migration is intentionally limited: the legacy data model only
 * marked income as recurring informally. We still create templates for both
 * INCOME and EXPENSE rows to preserve user intent.
 */
export const _legacyTypesIncluded = [TransactionType.INCOME, TransactionType.EXPENSE];
