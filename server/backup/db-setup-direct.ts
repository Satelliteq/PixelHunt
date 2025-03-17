/**
 * Veritabanı tabloları kurulum ve senkronizasyon modülü
 * Bu dosya doğrudan SQL sorguları kullanarak veritabanını kurar
 * ve Supabase ile senkronize eder
 */

import pkg from 'pg';
import 'dotenv/config';
const { Pool } = pkg;

// Veritabanı bağlantı havuzu
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Veritabanı tablolarını kurar
 */
export async function setupDatabase(): Promise<boolean> {
  console.log('Veritabanı kurulumu başlatılıyor...');
  
  try {
    // Schema oluştur
    await pool.query(`
      -- Önce kullanıcıları kontrol et ve eksik rolleri oluştur
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
          CREATE ROLE anon NOLOGIN;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
          CREATE ROLE authenticated NOLOGIN;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
          CREATE ROLE service_role NOLOGIN;
        END IF;
      END
      $$;
      
      -- Yetkileri ayarla
      GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
    `);
    console.log('Roller ve yetkiler oluşturuldu');
    
    // Tabloları oluştur
    await pool.query(`
      -- Users tablosu
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
      
      -- Categories tablosu
      CREATE TABLE IF NOT EXISTS public.categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        icon_url TEXT
      );
      
      -- Images tablosu
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
      
      -- Tests tablosu
      CREATE TABLE IF NOT EXISTS public.tests (
        id SERIAL PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES public.categories(id),
        creator_id INTEGER REFERENCES public.users(id),
        image_ids JSONB NOT NULL DEFAULT '[]',
        play_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT true,
        anonymous_creator BOOLEAN DEFAULT false,
        thumbnail TEXT,
        approved BOOLEAN DEFAULT false,
        published BOOLEAN DEFAULT false,
        difficulty INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Test yorumları tablosu
      CREATE TABLE IF NOT EXISTS public.test_comments (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES public.tests(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES public.users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Oyun skorları tablosu
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
    console.log('Tablolar başarıyla oluşturuldu');
    
    // Görünümler oluştur
    await pool.query(`
      -- Popüler testler view
      CREATE OR REPLACE VIEW public.popular_tests AS
      SELECT * FROM public.tests 
      WHERE published = true AND approved = true
      ORDER BY play_count DESC;
      
      -- En yeni testler view
      CREATE OR REPLACE VIEW public.newest_tests AS
      SELECT * FROM public.tests 
      WHERE published = true AND approved = true
      ORDER BY created_at DESC;
      
      -- Öne çıkan testler view
      CREATE OR REPLACE VIEW public.featured_tests AS
      SELECT * FROM public.tests 
      WHERE published = true AND approved = true
      ORDER BY play_count DESC, like_count DESC;
    `);
    console.log('Görünümler başarıyla oluşturuldu');
    
    // Stored procedure oluştur
    await pool.query(`
      -- Popüler testleri getir
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
      
      -- En yeni testleri getir
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
      
      -- Test oynanma sayacını artır
      CREATE OR REPLACE FUNCTION public.increment_test_play_count(test_id INTEGER)
      RETURNS VOID AS $$
      BEGIN
        UPDATE public.tests
        SET play_count = play_count + 1
        WHERE id = test_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Test beğeni sayacını artır
      CREATE OR REPLACE FUNCTION public.increment_test_like_count(test_id INTEGER)
      RETURNS VOID AS $$
      BEGIN
        UPDATE public.tests
        SET like_count = like_count + 1
        WHERE id = test_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('Stored procedureler başarıyla oluşturuldu');
    
    // Tabloların sahipliğini ayarla
    try {
      await pool.query(`
        -- Tabloların ve nesnelerin sahipliğini ayarla (Supabase için gerekli)
        ALTER TABLE public.users OWNER TO neondb_owner;
        ALTER TABLE public.categories OWNER TO neondb_owner;
        ALTER TABLE public.images OWNER TO neondb_owner;
        ALTER TABLE public.tests OWNER TO neondb_owner;
        ALTER TABLE public.test_comments OWNER TO neondb_owner;
        ALTER TABLE public.game_scores OWNER TO neondb_owner;
        
        ALTER VIEW public.popular_tests OWNER TO neondb_owner;
        ALTER VIEW public.newest_tests OWNER TO neondb_owner;
        ALTER VIEW public.featured_tests OWNER TO neondb_owner;
        
        ALTER FUNCTION public.get_popular_tests(INTEGER) OWNER TO neondb_owner;
        ALTER FUNCTION public.get_newest_tests(INTEGER) OWNER TO neondb_owner;
        ALTER FUNCTION public.increment_test_play_count(INTEGER) OWNER TO neondb_owner;
        ALTER FUNCTION public.increment_test_like_count(INTEGER) OWNER TO neondb_owner;
      `);
      console.log('Tablo sahiplikleri ve izinleri ayarlandı');
    } catch (ownerError) {
      console.error('Tablo sahiplikleri ayarlanırken hata oluştu:', ownerError);
      // Devam et, kritik değil
    }
    
    // Supabase'in şemaları yenilemesi için bildirim gönder
    await pool.query(`NOTIFY pgrst, 'reload schema';`);
    console.log('Supabase şema yenileme bildirimi gönderildi');
    
    // Kategori örnekleri oluştur
    // Kategorileri tek tek ekleyerek hata durumları ile başa çıkalım
    try {
      const categories = [
        { name: 'Genel', description: 'Genel kategori', icon_url: 'https://example.com/general.png' },
        { name: 'Sanat', description: 'Sanat kategori', icon_url: 'https://example.com/art.png' },
        { name: 'Filmler', description: 'Film ve diziler kategorisi', icon_url: 'https://example.com/movies.png' },
        { name: 'Müzik', description: 'Müzik kategorisi', icon_url: 'https://example.com/music.png' },
        { name: 'Spor', description: 'Spor kategorisi', icon_url: 'https://example.com/sports.png' }
      ];
      
      for (const category of categories) {
        try {
          await pool.query(`
            INSERT INTO public.categories (name, description, icon_url)
            VALUES ($1, $2, $3)
          `, [category.name, category.description, category.icon_url]);
          console.log(`${category.name} kategorisi eklendi`);
        } catch (err) {
          // Duplikasyon hatası varsayımsal olarak görmezden gelinir
          console.log(`${category.name} kategorisi eklenirken hata (muhtemelen zaten var):`, err.message);
        }
      }
      console.log('Kategori ekleme işlemleri tamamlandı');
    } catch (categoryError) {
      console.error('Kategoriler eklenirken bir hata oluştu:', categoryError);
    }
    console.log('Örnek kategoriler oluşturuldu');
    
    return true;
  } catch (error) {
    console.error('Veritabanı kurulum hatası:', error);
    return false;
  } finally {
    // Havuzu kapatmayı unutma
    await pool.end().catch(console.error);
  }
}

// Test için direkt çalıştırma
if (import.meta.url === (typeof document === 'undefined' ? new URL(process.argv[1], 'file:').href : undefined)) {
  setupDatabase().then(success => {
    if (success) {
      console.log('Veritabanı başarıyla kuruldu ve senkronize edildi');
      process.exit(0);
    } else {
      console.error('Veritabanı kurulumu başarısız!');
      process.exit(1);
    }
  }).catch(err => {
    console.error('Beklenmeyen hata:', err);
    process.exit(1);
  });
}