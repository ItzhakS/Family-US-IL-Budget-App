import { Settings } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
      <Settings size={48} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-bold text-gray-900">Settings</h3>
      <p className="text-gray-500 mt-2">
        Settings page coming soon. This will include category management, dark mode toggle, and profile settings.
      </p>
    </div>
  );
};
