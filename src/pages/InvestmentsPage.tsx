import { useTransactions } from '../contexts/TransactionsContext';
import { useShell } from '../contexts/ShellContext';
import { useBudgetCalculations } from '../hooks/useBudgetCalculations';
import { InvestmentsPanel } from '../components/InvestmentsPanel';

export const InvestmentsPage: React.FC = () => {
  const { transactions, remove } = useTransactions();
  const { selectedYears, exchangeRate, openEditForm } = useShell();
  const { yearFilteredTransactions } = useBudgetCalculations(
    transactions,
    selectedYears,
    exchangeRate
  );

  return (
    <InvestmentsPanel
      transactions={yearFilteredTransactions}
      onEdit={openEditForm}
      onDelete={(id) => void remove(id)}
    />
  );
};
