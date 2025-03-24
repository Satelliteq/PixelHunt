import { createClient } from '@supabase/supabase-js';

// Supabase URL ve API key'i doğrudan kullan (Vite bunları çevre değişkenlerine dönüştürüyor)
const supabaseUrl = 'https://amikewcdxjzqrpoqwizr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtaWtld2NkeGp6cXJwb3F3aXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMzk5NjksImV4cCI6MjA1NzYxNTk2OX0.MZWorujMKcfZJr86q8N5s83SeReIbXjfOQdfISBcO54';

// Supabase bağlantısını yarat
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return true; // Şimdi doğrudan bağlantıyı sağlıyoruz
};