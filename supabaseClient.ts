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

const supabaseUrl = envUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = envKey || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
