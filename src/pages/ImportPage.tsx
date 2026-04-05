import { Upload } from 'lucide-react';

export const ImportPage: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
      <Upload size={48} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-bold text-gray-900">Import Transactions</h3>
      <p className="text-gray-500 mt-2">
        Import page coming soon. This will support CSV files, receipt images, and PDF bank statements.
      </p>
    </div>
  );
};
