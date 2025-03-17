import { supabase } from './supabase-setup';
import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

// Veritabanı bağlantı havuzu
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Bu modül, Supabase veritabanını doğrudan SQL komutları ile başlatır
 * initialize-tables.ts dosyasından farklı olarak, doğrudan SQL komutlarını 
 * postgresql client ile çalıştırır
 */

export async function setupDatabaseTables() {
  console.log('Veritabanı tabloları başlatılıyor...');
  
  try {
    // Schema bilgisi olmadan doğrudan public schema'da tablo oluştur
    // Bu şekilde Supabase tarafından erişilebilir olacaklar
    
    // İlk olarak kategoriler tablosunu oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon_url TEXT
      );
    `);
    console.log('Categories tablosu oluşturuldu');
    
    // Kullanıcılar tablosunu oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        avatar TEXT,
        role TEXT DEFAULT 'user',
        banned BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users tablosu oluşturuldu');
    
    // Görseller tablosunu oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.images (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        answers JSONB NOT NULL,
        category_id INTEGER REFERENCES public.categories(id),
        play_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        difficulty INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Images tablosu oluşturuldu');
    
    // Testler tablosunu oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.tests (
        id SERIAL PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES public.categories(id),
        creator_id INTEGER REFERENCES public.users(id),
        image_ids JSONB NOT NULL,
        play_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT false,
        anonymous_creator BOOLEAN DEFAULT false,
        thumbnail TEXT,
        approved BOOLEAN DEFAULT false,
        published BOOLEAN DEFAULT false,
        difficulty INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tests tablosu oluşturuldu');
    
    // Test yorumları tablosunu oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.test_comments (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES public.tests(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES public.users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Test_comments tablosu oluşturuldu');
    
    // Oyun skorları tablosunu oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.game_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES public.users(id),
        test_id INTEGER REFERENCES public.tests(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        completion_time INTEGER,
        attempts_count INTEGER NOT NULL,
        completed BOOLEAN DEFAULT false,
        mode TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Game_scores tablosu oluşturuldu');
    
    // Görünümler oluştur
    await pool.query(`
      CREATE OR REPLACE VIEW public.popular_tests AS
      SELECT * FROM public.tests 
      WHERE published = true AND approved = true
      ORDER BY play_count DESC;
    `);
    
    await pool.query(`
      CREATE OR REPLACE VIEW public.newest_tests AS
      SELECT * FROM public.tests 
      WHERE published = true AND approved = true
      ORDER BY created_at DESC;
    `);
    
    await pool.query(`
      CREATE OR REPLACE VIEW public.featured_tests AS
      SELECT * FROM public.tests 
      WHERE published = true AND approved = true
      ORDER BY play_count DESC, like_count DESC;
    `);
    console.log('Görünümler oluşturuldu');
    
    // Stored prosedürleri oluştur
    await pool.query(`
      CREATE OR REPLACE FUNCTION public.get_popular_tests(limit_param INTEGER)
      RETURNS SETOF public.tests AS $$
      BEGIN
        RETURN QUERY
        SELECT * FROM public.tests 
        WHERE published = true AND approved = true
        ORDER BY play_count DESC
        LIMIT limit_param;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION public.get_newest_tests(limit_param INTEGER)
      RETURNS SETOF public.tests AS $$
      BEGIN
        RETURN QUERY
        SELECT * FROM public.tests 
        WHERE published = true AND approved = true
        ORDER BY created_at DESC
        LIMIT limit_param;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('Stored prosedürler oluşturuldu');
    
    // Supabase için gerekli izinleri ve sahiplikleri ayarla
    try {
      await pool.query(`
        -- Tabloların ve nesnelerin sahipliğini ayarla (optional)
        ALTER TABLE public.categories OWNER TO postgres;
        ALTER TABLE public.users OWNER TO postgres;
        ALTER TABLE public.images OWNER TO postgres;
        ALTER TABLE public.tests OWNER TO postgres;
        ALTER TABLE public.test_comments OWNER TO postgres;
        ALTER TABLE public.game_scores OWNER TO postgres;
        
        ALTER VIEW public.popular_tests OWNER TO postgres;
        ALTER VIEW public.newest_tests OWNER TO postgres;
        ALTER VIEW public.featured_tests OWNER TO postgres;
        
        ALTER FUNCTION public.get_popular_tests(INTEGER) OWNER TO postgres;
        ALTER FUNCTION public.get_newest_tests(INTEGER) OWNER TO postgres;
        ALTER FUNCTION public.exec_sql(TEXT) OWNER TO postgres;
        
        -- Anon ve service rollerine gerekli izinleri ver
        GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
      `);
      console.log('Supabase izinleri ayarlandı');
    } catch (permissionError) {
      console.error('İzin ayarlama hatası:', permissionError);
    }
    
    // Hızlı test kategorisi oluştur
    try {
      await pool.query(`
        INSERT INTO public.categories (name, description, icon_url)
        VALUES ('Genel', 'Genel kategorisi', 'https://example.com/icon.png')
        ON CONFLICT DO NOTHING;
      `);
      console.log('Test kategorisi oluşturuldu');
    } catch (categoryError) {
      console.error('Kategori oluşturma hatası:', categoryError);
    }
    
    console.log('Veritabanı tabloları başarıyla oluşturuldu');
    return true;
  } catch (error) {
    console.error('Veritabanı tabloları oluşturma hatası:', error);
    return false;
  }
}

// ES modules doesn't have require.main === module
// Instead we can check if the file was directly executed
// This won't run when imported by other modules
if (import.meta.url === (typeof document === 'undefined' ? new URL(process.argv[1], 'file:').href : undefined)) {
  setupDatabaseTables().then(() => {
    console.log('Veritabanı kurulumu tamamlandı');
    process.exit(0);
  }).catch(err => {
    console.error('Veritabanı kurulumu hatası:', err);
    process.exit(1);
  });
}