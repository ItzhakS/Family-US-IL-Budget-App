import { useApp } from '../contexts/AppContext';
import { RecurringPanel } from '../components/RecurringPanel';

export const RecurringPage: React.FC = () => {
  const { yearFilteredTransactions } = useApp();

  return <RecurringPanel transactions={yearFilteredTransactions} />;
};
