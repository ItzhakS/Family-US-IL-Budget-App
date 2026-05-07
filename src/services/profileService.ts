import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

type ProfilePreferenceRow = {
  dark_mode: boolean | null;
};

export async function getDarkModePreference(userId: string): Promise<boolean | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('dark_mode')
    .eq('id', userId)
    .single<ProfilePreferenceRow>();

  if (error) {
    console.warn('Could not load profile theme preference:', error.message);
    return null;
  }

  return data.dark_mode ?? null;
}

export async function updateDarkModePreference(userId: string, darkMode: boolean): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('profiles')
    .update({ dark_mode: darkMode })
    .eq('id', userId);

  if (error) {
    console.warn('Could not save profile theme preference:', error.message);
  }
}
