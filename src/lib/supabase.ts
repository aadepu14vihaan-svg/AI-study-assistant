import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment or user-saved localStorage configuration
const getStoredCredentials = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('smart_school_supabase_url') || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('smart_school_supabase_key') || '' : '';

  const url = envUrl || localUrl;
  const key = envKey || localKey;

  return { url, key, isCustom: !!(localUrl && localKey) };
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getStoredCredentials();
  if (!url || !key) return null;

  try {
    if (!supabaseInstance) {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    }
    return supabaseInstance;
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    return null;
  }
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getStoredCredentials();
  return Boolean(url && key && url.startsWith('http'));
};

export const saveSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('smart_school_supabase_url', url.trim());
    localStorage.setItem('smart_school_supabase_key', key.trim());
    supabaseInstance = null; // force re-instantiation
  }
};

export const clearSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('smart_school_supabase_url');
    localStorage.removeItem('smart_school_supabase_key');
    supabaseInstance = null;
  }
};

export const testSupabaseConnection = async (url: string, key: string): Promise<{ success: boolean; message: string }> => {
  try {
    const client = createClient(url.trim(), key.trim());
    // Quick test query to verify credentials
    const { error } = await client.from('assignments').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, check auth
      const { error: authError } = await client.auth.getSession();
      if (authError) {
        return { success: false, message: authError.message };
      }
      return { 
        success: true, 
        message: 'Connected to Supabase! (Note: run supabase/schema.sql in your Supabase SQL editor to create tables)' 
      };
    }
    return { success: true, message: 'Successfully connected and verified database access!' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown connection error';
    return { success: false, message: errorMsg };
  }
};
