import { useTransactions } from '../contexts/TransactionsContext';
import { useShell } from '../contexts/ShellContext';
import { useBudgetCalculations } from '../hooks/useBudgetCalculations';
import { RecurringPanel } from '../components/RecurringPanel';

export const RecurringPage: React.FC = () => {
  const { transactions } = useTransactions();
  const { selectedYears, exchangeRate } = useShell();
  const { yearFilteredTransactions } = useBudgetCalculations(
    transactions,
    selectedYears,
    exchangeRate
  );

  return <RecurringPanel transactions={yearFilteredTransactions} />;
};
