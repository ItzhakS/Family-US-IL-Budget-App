import React, { createContext, useContext } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light' });

export const useTheme = () => useContext(ThemeContext);

/** Placeholder until Phase 3 dark mode wires tokens + toggle. */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeContext.Provider value={{ theme: 'light' }}>{children}</ThemeContext.Provider>
);
