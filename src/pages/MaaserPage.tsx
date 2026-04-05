import { useApp } from '../contexts/AppContext';
import { MaaserTracker } from '../components/MaaserTracker';

export const MaaserPage: React.FC = () => {
  const {
    yearFilteredTransactions,
    handleDeleteTransaction,
    openEditForm,
  } = useApp();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 border-b pb-2">₪ Shekels (ILS)</h3>
        <MaaserTracker
          transactions={yearFilteredTransactions}
          currency="ILS"
          onEdit={openEditForm}
          onDelete={handleDeleteTransaction}
        />
      </div>
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 border-b pb-2">$ Dollars (USD)</h3>
        <MaaserTracker
          transactions={yearFilteredTransactions}
          currency="USD"
          onEdit={openEditForm}
          onDelete={handleDeleteTransaction}
        />
      </div>
    </div>
  );
};
