import { RecurringTemplate, Transaction, TransactionType } from '../types';
import {
  addMonths,
  currentYearMonth,
  dateForMonth,
  isTemplateActive,
  monthOfDate,
  monthRangeInclusive,
} from './recurringUtils';

export interface GenerationItem {
  /** New transaction to create (no id, no FX yet — service snapshots FX). */
  transaction: Omit<Transaction, 'id'>;
  /** YYYY-MM the transaction is scheduled for. */
  month: string;
}

export interface TemplatePlan {
  templateId: string;
  /** All transactions to create for this template. */
  items: GenerationItem[];
  /** Patch to apply to the template after items are persisted. */
  templatePatch: {
    lastGeneratedMonth: string;
    remainingPayments?: number | null;
  } | null;
}

/**
 * Pure planner: computes which transactions to create for a single template,
 * plus the resulting template patch. Idempotent re-runs against the same input
 * produce the same plan (uses `lastGeneratedMonth` and existing template-linked
 * transactions to avoid duplicates).
 *
 * Hard floor: never generates earlier than `template.startMonth`.
 */
export function planTemplateGeneration(
  template: RecurringTemplate,
  existingTxs: Transaction[],
  now: Date = new Date()
): TemplatePlan {
  if (!isTemplateActive(template)) {
    return { templateId: template.id, items: [], templatePatch: null };
  }

  const todayMonth = currentYearMonth(now);

  // Start one month after the last generated month, but never earlier than startMonth.
  const fromCandidate = template.lastGeneratedMonth
    ? addMonths(template.lastGeneratedMonth, 1)
    : template.startMonth;
  const fromMonth = fromCandidate < template.startMonth ? template.startMonth : fromCandidate;

  if (fromMonth > todayMonth) {
    return { templateId: template.id, items: [], templatePatch: null };
  }

  const candidateMonths = monthRangeInclusive(fromMonth, todayMonth);

  // Defensive: skip months that already have a transaction for this template
  // (handles partial failures or concurrent generation).
  const existingMonthsForTemplate = new Set(
    existingTxs
      .filter((t) => t.recurringTemplateId === template.id)
      .map((t) => monthOfDate(t.date))
  );

  const monthsToGenerate: string[] = [];
  let remaining = template.remainingPayments;
  for (const month of candidateMonths) {
    if (existingMonthsForTemplate.has(month)) continue;
    if (remaining != null && remaining <= 0) break;
    monthsToGenerate.push(month);
    if (remaining != null) remaining -= 1;
  }

  if (monthsToGenerate.length === 0) {
    return { templateId: template.id, items: [], templatePatch: null };
  }

  const items: GenerationItem[] = monthsToGenerate.map((month) => ({
    month,
    transaction: {
      date: dateForMonth(month, template.dayOfMonth),
      description: template.description,
      amount: template.amount,
      category: template.category,
      type: template.type,
      currency: template.currency,
      isRecurring: template.type === TransactionType.EXPENSE,
      isMaaserDeductible: template.isMaaserDeductible,
      isMaaserPayment: template.isMaaserPayment,
      isNonMaaserIncome: false,
      isTaxDeductible: template.isTaxDeductible,
      isInvestment: template.isInvestment,
      isTaxSavings: template.isTaxSavings,
      recurringCancelledAt: null,
      recurringRemainingPayments: null,
      recurringTemplateId: template.id,
    },
  }));

  const lastGeneratedMonth = monthsToGenerate[monthsToGenerate.length - 1];
  const templatePatch: TemplatePlan['templatePatch'] = {
    lastGeneratedMonth,
    ...(template.remainingPayments != null
      ? { remainingPayments: Math.max(0, template.remainingPayments - monthsToGenerate.length) }
      : {}),
  };

  return { templateId: template.id, items, templatePatch };
}

/** Plan generation across many templates against the same transaction snapshot. */
export function planAllGenerations(
  templates: RecurringTemplate[],
  existingTxs: Transaction[],
  now: Date = new Date()
): TemplatePlan[] {
  return templates
    .map((t) => planTemplateGeneration(t, existingTxs, now))
    .filter((p) => p.items.length > 0);
}
