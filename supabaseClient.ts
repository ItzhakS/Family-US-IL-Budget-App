import { createClient } from '@supabase/supabase-js';

// These will be provided by your Supabase project settings
// When deploying to Vercel, these become Environment Variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
