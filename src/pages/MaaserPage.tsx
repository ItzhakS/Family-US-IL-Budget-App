import { useMemo, useState, useCallback } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useTransactions } from '../contexts/TransactionsContext';
import { useShell } from '../contexts/ShellContext';
import { useBudgetCalculations } from '../hooks/useBudgetCalculations';
import { useTransactionListFilterState } from '../hooks/useTransactionListFilterState';
import { TransactionListFilters } from '../components/TransactionListFilters';
import { MaaserSummaryPanel, MaaserTransactionListPanel } from '../components/MaaserTracker';
import { MaaserCrossCurrencyOffsetForm } from '../components/MaaserCrossCurrencyOffsetForm';
import { MaaserSkeleton } from '../components/Skeleton';
import { canCrossCurrencyOffset } from '../lib/maaserCalculations';
import type { Transaction } from '../types';
import { useToast } from '../contexts/ToastContext';

export const MaaserPage: React.FC = () => {
  const { transactions, loading, remove, removeByMaaserOffsetPairId, refresh } =
    useTransactions();
  const { selectedYears, exchangeRate, openEditForm, openCopyForm } = useShell();
  const { addToast } = useToast();
  const { yearFilteredTransactions } = useBudgetCalculations(
    transactions,
    selectedYears,
    exchangeRate
  );

  const [offsetFormOpen, setOffsetFormOpen] = useState(false);
  const [editingPairId, setEditingPairId] = useState<string | null>(null);
  const [editPrefill, setEditPrefill] = useState<{
    date: string;
    amount: string;
  } | null>(null);

  const offsetEligibility = useMemo(
    () => canCrossCurrencyOffset(yearFilteredTransactions, exchangeRate),
    [yearFilteredTransactions, exchangeRate]
  );

  const editingOffsetConfig = useMemo(() => {
    if (!editingPairId) return null;
    const legs = transactions.filter((t) => t.maaserOffsetPairId === editingPairId);
    const creditLeg = legs.find((t) => t.isMaaserCrossCurrencyCredit);
    const debtLeg = legs.find((t) => t.isMaaserPayment && !t.isMaaserCrossCurrencyCredit);
    if (!creditLeg || !debtLeg) return null;
    return {
      creditCurrency: creditLeg.currency,
      debtCurrency: debtLeg.currency,
    };
  }, [editingPairId, transactions]);

  const activeOffsetConfig = editingOffsetConfig ?? offsetEligibility;

  const transactionsForOffset = useMemo(() => {
    if (!editingPairId) return yearFilteredTransactions;
    return yearFilteredTransactions.filter((t) => t.maaserOffsetPairId !== editingPairId);
  }, [yearFilteredTransactions, editingPairId]);

  const { applyListFilters, transactionListFilterProps } = useTransactionListFilterState(
    yearFilteredTransactions,
    selectedYears,
    { idPrefix: 'maaser-list-' }
  );

  const maaserOnly = useMemo(
    () =>
      yearFilteredTransactions.filter(
        (t) =>
          t.isMaaserDeductible ||
          t.isMaaserPayment ||
          t.isMaaserCrossCurrencyCredit
      ),
    [yearFilteredTransactions]
  );

  const filteredMaaser = useMemo(
    () => applyListFilters(maaserOnly),
    [applyListFilters, maaserOnly]
  );

  const openNewOffsetForm = useCallback(() => {
    setEditingPairId(null);
    setEditPrefill(null);
    setOffsetFormOpen(true);
  }, []);

  const openEditOffsetForm = useCallback(
    (pairId: string) => {
      const legs = transactions.filter((t) => t.maaserOffsetPairId === pairId);
      const creditLeg = legs.find((t) => t.isMaaserCrossCurrencyCredit);
      if (!creditLeg) return;

      setEditingPairId(pairId);
      setEditPrefill({
        date: creditLeg.date,
        amount: String(creditLeg.amount),
      });
      setOffsetFormOpen(true);
    },
    [transactions]
  );

  const handleDelete = useCallback(
    (id: string, tx: Transaction) => {
      if (tx.maaserOffsetPairId) {
        const ok = window.confirm(
          "Delete this cross-currency offset? Both linked legs will be removed."
        );
        if (!ok) return;
        void removeByMaaserOffsetPairId(tx.maaserOffsetPairId).then(() => {
          addToast('Cross-currency offset deleted.', 'success');
        });
        return;
      }
      void remove(id);
    },
    [remove, removeByMaaserOffsetPairId, addToast]
  );

  const handleEdit = useCallback(
    (id: string, tx: Transaction) => {
      if (tx.maaserOffsetPairId) {
        openEditOffsetForm(tx.maaserOffsetPairId);
        return;
      }
      openEditForm(id);
    },
    [openEditForm, openEditOffsetForm]
  );

  const listProps = {
    onCopy: (id: string) => {
      const tx = transactions.find((t) => t.id === id);
      if (tx?.maaserOffsetPairId) return;
      openCopyForm(id);
    },
    onEdit: (id: string) => {
      const tx = transactions.find((t) => t.id === id);
      if (tx) handleEdit(id, tx);
    },
    onDelete: (id: string) => {
      const tx = transactions.find((t) => t.id === id);
      if (tx) handleDelete(id, tx);
    },
  };

  if (loading && transactions.length === 0) {
    return <MaaserSkeleton />;
  }

  return (
    <div className="space-y-6">
      {offsetEligibility && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={openNewOffsetForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm"
          >
            <ArrowLeftRight size={16} />
            Balance currencies
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MaaserSummaryPanel transactions={yearFilteredTransactions} currency="ILS" />
        <MaaserSummaryPanel transactions={yearFilteredTransactions} currency="USD" />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          Filters apply only to the ma&apos;aser transaction tables below. Fund cards and month
          breakdowns follow the header year selection only.
        </p>
        <TransactionListFilters {...transactionListFilterProps} />
      </div>

      <div className="lg:hidden">
        <MaaserTransactionListPanel transactions={filteredMaaser} {...listProps} />
      </div>

      <div className="hidden lg:grid lg:grid-cols-2 gap-8">
        <MaaserTransactionListPanel
          transactions={filteredMaaser.filter((t) => t.currency === 'ILS')}
          currency="ILS"
          {...listProps}
        />
        <MaaserTransactionListPanel
          transactions={filteredMaaser.filter((t) => t.currency === 'USD')}
          currency="USD"
          {...listProps}
        />
      </div>

      {offsetFormOpen && activeOffsetConfig && (
        <MaaserCrossCurrencyOffsetForm
          transactions={transactionsForOffset}
          exchangeRate={exchangeRate}
          creditCurrency={activeOffsetConfig.creditCurrency}
          debtCurrency={activeOffsetConfig.debtCurrency}
          editingPairId={editingPairId}
          initialDate={editPrefill?.date}
          initialAmount={editPrefill?.amount}
          onSuccess={() => {
            void refresh();
            addToast(
              editingPairId ? 'Offset updated.' : 'Cross-currency offset applied.',
              'success'
            );
          }}
          onClose={() => {
            setOffsetFormOpen(false);
            setEditingPairId(null);
            setEditPrefill(null);
          }}
        />
      )}
    </div>
  );
};
