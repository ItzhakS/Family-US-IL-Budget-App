import { Upload } from 'lucide-react';

export const ImportPage: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
      <Upload size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">Import Transactions</h3>
      <p className="text-gray-500 dark:text-gray-400 mt-2">
        Import page coming soon. This will support CSV files, receipt images, and PDF bank statements.
      </p>
    </div>
  );
};
