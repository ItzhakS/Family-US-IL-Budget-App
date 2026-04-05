import { useApp } from '../contexts/AppContext';
import { InvestmentsPanel } from '../components/InvestmentsPanel';

export const InvestmentsPage: React.FC = () => {
  const {
    yearFilteredTransactions,
    handleDeleteTransaction,
    openEditForm,
  } = useApp();

  return (
    <InvestmentsPanel
      transactions={yearFilteredTransactions}
      onEdit={openEditForm}
      onDelete={handleDeleteTransaction}
    />
  );
};
