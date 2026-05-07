import { Moon, Settings, Sun } from 'lucide-react';
import { CategorySettings } from '../components/CategorySettings';
import { useTheme } from '../contexts/ThemeContext';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Settings size={28} className="text-text-secondary dark:text-gray-400" aria-hidden />
        <h1 className="text-xl font-bold text-text-primary dark:text-gray-50">Settings</h1>
      </div>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary dark:text-gray-50">Appearance</h2>
            <p className="mt-1 text-sm text-text-secondary dark:text-gray-400">
              Choose light or dark mode. Signed-in users sync this preference across devices.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-800"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </section>

      <CategorySettings />
    </div>
  );
};
