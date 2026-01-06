import { createClient } from '@supabase/supabase-js';

// Safe access to process.env for various environments
const getEnv = (key: string) => {
  try {
    return process.env[key];
  } catch {
    return '';
  }
};

// Use placeholders if env vars are missing to prevent immediate crash
// This allows App.tsx to check configuration and show a setup guide
const envUrl = getEnv('REACT_APP_SUPABASE_URL') || getEnv('SUPABASE_URL');
const envKey = getEnv('REACT_APP_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

// Check if properly configured
export const isSupabaseConfigured = !!(envUrl && envKey);

export const supabaseUrl = envUrl || 'https://placeholder.supabase.co';
export const supabaseAnonKey = envKey || 'placeholder-key';

// Create Supabase client with localStorage for session persistence
// This ensures sessions persist across tabs and browser restarts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Supabase will automatically use BroadcastChannel for cross-tab synchronization
  },
});
