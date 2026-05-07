import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import * as profileService from '../services/profileService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const THEME_STORAGE_KEY = 'family-budget-theme';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoMode } = useAuth();
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [profilePreferenceLoaded, setProfilePreferenceLoaded] = useState(false);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    setProfilePreferenceLoaded(false);

    if (!user || isDemoMode || !isSupabaseConfigured) {
      setProfilePreferenceLoaded(true);
      return;
    }

    let ignore = false;

    void (async () => {
      const profileDarkMode = await profileService.getDarkModePreference(user.id);
      if (ignore) return;

      if (profileDarkMode != null) {
        setThemeState(profileDarkMode ? 'dark' : 'light');
      }
      setProfilePreferenceLoaded(true);
    })();

    return () => {
      ignore = true;
    };
  }, [user, isDemoMode]);

  useEffect(() => {
    if (!profilePreferenceLoaded || !user || isDemoMode || !isSupabaseConfigured) return;
    void profileService.updateDarkModePreference(user.id, theme === 'dark');
  }, [profilePreferenceLoaded, user, isDemoMode, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};
