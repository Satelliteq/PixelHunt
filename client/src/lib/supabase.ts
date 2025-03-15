import { createClient } from '@supabase/supabase-js';

// Use environment variables - try to get them from window.__ENV__
const getSupabaseCredentials = () => {
  let supabaseUrl = '';
  let supabaseAnonKey = '';
  
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    supabaseUrl = (window as any).__ENV__.SUPABASE_URL || '';
    supabaseAnonKey = (window as any).__ENV__.SUPABASE_ANON_KEY || '';
  }
  
  return { supabaseUrl, supabaseAnonKey };
};

// Initialize and export Supabase client
const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};