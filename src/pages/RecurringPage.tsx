import { useMemo } from 'react';
import { useTransactions } from '../contexts/TransactionsContext';
import { useShell } from '../contexts/ShellContext';
import { RecurringPanel } from '../components/RecurringPanel';
import { isActiveRecurringListRow } from '../lib/recurringUtils';

export const RecurringPage: React.FC = () => {
  const { transactions, update } = useTransactions();
  const { selectedYears } = useShell();

  /** Include rows in selected year(s), plus active recurring bills from any year (anchor date may be earlier). */
  const recurringScopeTransactions = useMemo(() => {
    const yearSet = new Set(selectedYears);
    return transactions.filter((t) => {
      const y = parseInt(t.date.split('-')[0], 10);
      if (!Number.isNaN(y) && yearSet.has(y)) return true;
      return isActiveRecurringListRow(t);
    });
  }, [transactions, selectedYears]);

  return (
    <RecurringPanel
      transactions={recurringScopeTransactions}
      onUpdateTransaction={(id, patch) => void update(id, patch)}
    />
  );
};
