import { Settings } from 'lucide-react';
import { CategorySettings } from '../components/CategorySettings';

export const SettingsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Settings size={28} className="text-text-secondary dark:text-gray-400" aria-hidden />
        <h1 className="text-xl font-bold text-text-primary dark:text-gray-50">Settings</h1>
      </div>

      <CategorySettings />

      <p className="text-center text-sm text-text-secondary dark:text-gray-400">
        More settings (theme, profile) will appear here in a later phase.
      </p>
    </div>
  );
};
