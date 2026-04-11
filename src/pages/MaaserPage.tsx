import { useMemo } from 'react';
import { useTransactions } from '../contexts/TransactionsContext';
import { useShell } from '../contexts/ShellContext';
import { useBudgetCalculations } from '../hooks/useBudgetCalculations';
import { useTransactionListFilterState } from '../hooks/useTransactionListFilterState';
import { TransactionListFilters } from '../components/TransactionListFilters';
import { MaaserSummaryPanel, MaaserTransactionListPanel } from '../components/MaaserTracker';

export const MaaserPage: React.FC = () => {
  const { transactions, remove } = useTransactions();
  const { selectedYears, exchangeRate, openEditForm } = useShell();
  const { yearFilteredTransactions } = useBudgetCalculations(
    transactions,
    selectedYears,
    exchangeRate
  );

  const { applyListFilters, transactionListFilterProps } = useTransactionListFilterState(
    yearFilteredTransactions,
    selectedYears,
    { idPrefix: 'maaser-list-' }
  );

  const maaserOnly = useMemo(
    () =>
      yearFilteredTransactions.filter((t) => t.isMaaserDeductible || t.isMaaserPayment),
    [yearFilteredTransactions]
  );

  const filteredMaaser = useMemo(
    () => applyListFilters(maaserOnly),
    [applyListFilters, maaserOnly]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MaaserSummaryPanel transactions={yearFilteredTransactions} currency="ILS" />
        <MaaserSummaryPanel transactions={yearFilteredTransactions} currency="USD" />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          Filters apply only to the ma&apos;aser transaction tables below. Fund cards and month breakdowns follow the
          header year selection only.
        </p>
        <TransactionListFilters {...transactionListFilterProps} />
      </div>

      <div className="lg:hidden">
        <MaaserTransactionListPanel
          transactions={filteredMaaser}
          onEdit={openEditForm}
          onDelete={(id) => void remove(id)}
        />
      </div>

      <div className="hidden lg:grid lg:grid-cols-2 gap-8">
        <MaaserTransactionListPanel
          transactions={filteredMaaser.filter((t) => t.currency === 'ILS')}
          currency="ILS"
          onEdit={openEditForm}
          onDelete={(id) => void remove(id)}
        />
        <MaaserTransactionListPanel
          transactions={filteredMaaser.filter((t) => t.currency === 'USD')}
          currency="USD"
          onEdit={openEditForm}
          onDelete={(id) => void remove(id)}
        />
      </div>
    </div>
  );
};
