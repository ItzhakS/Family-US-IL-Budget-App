import { useTransactions } from '../contexts/TransactionsContext';
import { useShell } from '../contexts/ShellContext';
import { useBudgetCalculations } from '../hooks/useBudgetCalculations';
import { InvestmentsPanel } from '../components/InvestmentsPanel';

export const InvestmentsPage: React.FC = () => {
  const { transactions, remove } = useTransactions();
  const { selectedYears, exchangeRate, openEditForm, openCopyForm } = useShell();
  const { yearFilteredTransactions, sumTransactionsAsCurrency } = useBudgetCalculations(
    transactions,
    selectedYears,
    exchangeRate
  );

  return (
    <InvestmentsPanel
      transactions={yearFilteredTransactions}
      sumTransactionsAsCurrency={sumTransactionsAsCurrency}
      onCopy={openCopyForm}
      onEdit={openEditForm}
      onDelete={(id) => void remove(id)}
    />
  );
};
