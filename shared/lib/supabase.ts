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

// Supabase ile veritabanı tabloları oluşturma işlevi
export const initSupabaseTables = async () => {
  try {
    // Users tablosu
    const { error: usersError } = await supabase.rpc('create_users_table_if_not_exists');
    if (usersError) console.error('Users tablosu oluşturma hatası:', usersError);
    
    // Categories tablosu
    const { error: categoriesError } = await supabase.rpc('create_categories_table_if_not_exists');
    if (categoriesError) console.error('Categories tablosu oluşturma hatası:', categoriesError);
    
    // Images tablosu
    const { error: imagesError } = await supabase.rpc('create_images_table_if_not_exists');
    if (imagesError) console.error('Images tablosu oluşturma hatası:', imagesError);
    
    // Tests tablosu
    const { error: testsError } = await supabase.rpc('create_tests_table_if_not_exists');
    if (testsError) console.error('Tests tablosu oluşturma hatası:', testsError);
    
    // Test Comments tablosu
    const { error: testCommentsError } = await supabase.rpc('create_test_comments_table_if_not_exists');
    if (testCommentsError) console.error('Test Comments tablosu oluşturma hatası:', testCommentsError);
    
    // Game Scores tablosu
    const { error: gameScoresError } = await supabase.rpc('create_game_scores_table_if_not_exists');
    if (gameScoresError) console.error('Game Scores tablosu oluşturma hatası:', gameScoresError);
    
    console.log('Supabase tabloları başarıyla oluşturuldu veya zaten mevcuttu.');
    return true;
  } catch (error) {
    console.error('Supabase tabloları oluşturulurken hata:', error);
    return false;
  }
};

// Supabase StorageProvider oluşturma
export const supabaseStorage = supabase.storage.from('test-images');

// Görsel yükleme işlevi
export const uploadImage = async (file: File, path: string): Promise<string | null> => {
  try {
    const { data, error } = await supabaseStorage.upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
    
    if (error) {
      console.error('Görsel yükleme hatası:', error);
      return null;
    }
    
    // Public URL oluştur
    const { data: publicURL } = supabaseStorage.getPublicUrl(data.path);
    return publicURL.publicUrl;
  } catch (error) {
    console.error('Görsel yükleme hatası:', error);
    return null;
  }
};