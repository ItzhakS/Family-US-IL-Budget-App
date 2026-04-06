import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Category } from '../types';
import { useAuth } from './AuthContext';
import * as categoryService from '../services/categoryService';
import { isDemoSessionActive } from '../services/demoStorage';

interface CategoriesContextValue {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export const useCategories = () => {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within a CategoriesProvider');
  return ctx;
};

export const CategoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoMode } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const demo = isDemoSessionActive() || isDemoMode;
    if (!user && !demo) {
      setCategories([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await categoryService.getAll();
      setCategories(rows);
    } catch (e) {
      console.error('Failed to load categories:', e);
      setError(e instanceof Error ? e.message : 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    void refresh();
  }, [refresh, user, isDemoMode]);

  const value: CategoriesContextValue = {
    categories,
    loading,
    error,
    refresh,
  };

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
};
