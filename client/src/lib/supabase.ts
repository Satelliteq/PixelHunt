import { createClient } from '@supabase/supabase-js';

let supabaseClient: ReturnType<typeof createClient> | null = null;

// Get environment variables from window.__ENV__ (which is populated in index.html)
function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  
  // Default to environment variables in import.meta.env if available
  let supabaseUrl = import.meta.env.SUPABASE_URL as string;
  let supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY as string;
  
  // Check if window.__ENV__ has values from server
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    supabaseUrl = (window as any).__ENV__.SUPABASE_URL || supabaseUrl;
    supabaseAnonKey = (window as any).__ENV__.SUPABASE_ANON_KEY || supabaseAnonKey;
  }
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Authentication features will not work.');
    return null;
  }
  
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
  
  return supabaseClient;
}

// Initialize and export Supabase client
export const supabase = getSupabaseClient() || createClient('', '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});