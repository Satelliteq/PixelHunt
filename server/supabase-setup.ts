import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const connectionString = process.env.DATABASE_URL || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// PostgreSQL client for direct database operations (only for table creation)
const pgClient = postgres(connectionString, { max: 1 });

/**
 * Doğrudan PostgreSQL üzerinden tabloları oluşturur ve içeriği Supabase'e ekler
 */
export async function setupSupabaseTables() {
  console.log('Supabase ve PostgreSQL tabloları oluşturuluyor...');
  
  try {
    // Doğrudan PostgreSQL bağlantısı ile tabloları oluştur
    await createTablesWithPostgres();
    
    // Supabase ile kategorileri oluştur
    await createCategories();
    
    console.log('Supabase tablo kurulumu tamamlandı');
    return true;
  } catch (error) {
    console.error('Supabase tablo kurulumu hatası:', error);
    return false;
  }
}

/**
 * PostgreSQL kullanarak tabloları oluştur
 */
async function createTablesWithPostgres() {
  try {
    // Tests tablosu
    await pgClient`
      CREATE TABLE IF NOT EXISTS public.tests (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        uuid TEXT NOT NULL UNIQUE,
        category_id INTEGER,
        creator_id INTEGER,
        image_ids JSONB NOT NULL DEFAULT '[]',
        play_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_public BOOLEAN DEFAULT true,
        anonymous_creator BOOLEAN DEFAULT false,
        thumbnail TEXT,
        approved BOOLEAN DEFAULT false,
        published BOOLEAN DEFAULT true,
        difficulty INTEGER DEFAULT 1
      )
    `;
    console.log('Tests tablosu oluşturuldu veya zaten var');

    // Categories tablosu
    await pgClient`
      CREATE TABLE IF NOT EXISTS public.categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon_url TEXT
      )
    `;
    console.log('Categories tablosu oluşturuldu veya zaten var');

    // Game_scores tablosu
    await pgClient`
      CREATE TABLE IF NOT EXISTS public.game_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        test_id INTEGER,
        score INTEGER NOT NULL,
        attempts_count INTEGER DEFAULT 1,
        completion_time INTEGER,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Game_scores tablosu oluşturuldu veya zaten var');

    // Images tablosu
    await pgClient`
      CREATE TABLE IF NOT EXISTS public.images (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        category_id INTEGER,
        correct_answers JSONB NOT NULL DEFAULT '[]',
        difficulty INTEGER DEFAULT 1,
        play_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Images tablosu oluşturuldu veya zaten var');

    // Test_comments tablosu
    await pgClient`
      CREATE TABLE IF NOT EXISTS public.test_comments (
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL,
        user_id INTEGER,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Test_comments tablosu oluşturuldu veya zaten var');

    // Users tablosu (eğer auth.users tablosunu kullanmıyorsanız)
    await pgClient`
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        avatar TEXT,
        role TEXT DEFAULT 'user',
        banned BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Users tablosu oluşturuldu veya zaten var');

    // Tablo görünümleri (views)
    try {
      await pgClient`
        CREATE OR REPLACE VIEW public.popular_tests AS
        SELECT * FROM public.tests 
        WHERE published = true AND approved = true
        ORDER BY play_count DESC, like_count DESC
      `;
      
      await pgClient`
        CREATE OR REPLACE VIEW public.newest_tests AS
        SELECT * FROM public.tests 
        WHERE published = true AND approved = true
        ORDER BY created_at DESC
      `;
      
      await pgClient`
        CREATE OR REPLACE VIEW public.featured_tests AS
        SELECT * FROM public.tests 
        WHERE published = true AND approved = true
        ORDER BY play_count DESC, like_count DESC
      `;
      console.log('Görünümler (views) oluşturuldu');
    } catch (viewError) {
      console.error('Görünümler oluşturma hatası:', viewError);
    }

    // Stored prosedürler
    try {
      await pgClient`
        CREATE OR REPLACE FUNCTION public.get_popular_tests(limit_param INTEGER)
        RETURNS SETOF public.tests AS $$
        BEGIN
          RETURN QUERY
          SELECT * FROM public.tests
          WHERE published = true AND approved = true
          ORDER BY play_count DESC, like_count DESC
          LIMIT limit_param;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER
      `;
      
      await pgClient`
        CREATE OR REPLACE FUNCTION public.get_newest_tests(limit_param INTEGER)
        RETURNS SETOF public.tests AS $$
        BEGIN
          RETURN QUERY
          SELECT * FROM public.tests
          WHERE published = true AND approved = true
          ORDER BY created_at DESC
          LIMIT limit_param;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER
      `;
      
      await pgClient`
        CREATE OR REPLACE FUNCTION public.increment_test_play_count(test_id INTEGER)
        RETURNS void AS $$
        BEGIN
          UPDATE public.tests
          SET play_count = play_count + 1
          WHERE id = test_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER
      `;
      
      await pgClient`
        CREATE OR REPLACE FUNCTION public.increment_test_like_count(test_id INTEGER)
        RETURNS void AS $$
        BEGIN
          UPDATE public.tests
          SET like_count = like_count + 1
          WHERE id = test_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER
      `;

      // Function to execute arbitrary SQL (useful for Supabase RPC)
      await pgClient`
        CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
        RETURNS JSONB AS $$
        DECLARE
          result JSONB;
        BEGIN
          EXECUTE 'SELECT json_agg(t) FROM (' || sql_query || ') t' INTO result;
          RETURN COALESCE(result, '[]'::JSONB);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER
      `;
      console.log('Stored prosedürler oluşturuldu');
    } catch (procError) {
      console.error('Stored prosedürler oluşturma hatası:', procError);
    }

    // Supabase için gerekli izinleri ve sahiplikleri ayarla
    try {
      await pgClient`
        -- Tabloların ve nesnelerin sahipliğini ayarla
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
        ALTER FUNCTION public.increment_test_play_count(INTEGER) OWNER TO postgres;
        ALTER FUNCTION public.increment_test_like_count(INTEGER) OWNER TO postgres;
        ALTER FUNCTION public.exec_sql(TEXT) OWNER TO postgres;
        
        -- Anon ve service rollerine gerekli izinleri ver
        GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
      `;
      console.log('Supabase izinleri ayarlandı');
    } catch (permError) {
      console.error('İzin ayarlama hatası:', permError);
    }

    return true;
  } catch (error) {
    console.error('PostgreSQL ile tablo oluşturma hatası:', error);
    return false;
  }
}

/**
 * Kategori oluşturma
 */
async function createCategories() {
  // Kategorileri kontrol et, yoksa oluştur
  const { data: existingCategories, error } = await supabase
    .from('categories')
    .select('name');
  
  if (error) {
    console.error('Kategori sorgulama hatası:', error);
    return false;
  }
  
  // Eğer kategori yoksa ekle
  if (!existingCategories || existingCategories.length === 0) {
    const sampleCategories = [
      { 
        name: 'Otomobiller', 
        description: 'Araçlar ve otomobillerle ilgili testler', 
        icon_url: 'https://api.iconify.design/mdi:car.svg' 
      },
      { 
        name: 'Coğrafya', 
        description: 'Haritalar, şehirler ve coğrafi konuları içeren testler', 
        icon_url: 'https://api.iconify.design/mdi:earth.svg' 
      },
      { 
        name: 'Film ve TV', 
        description: 'Filmler, diziler ve TV programları hakkında testler', 
        icon_url: 'https://api.iconify.design/mdi:movie.svg' 
      },
      { 
        name: 'Sanat', 
        description: 'Tüm sanat dalları ve ilgili testler', 
        icon_url: 'https://api.iconify.design/mdi:palette.svg' 
      }
    ];
    
    const { error: insertError } = await supabase
      .from('categories')
      .insert(sampleCategories);
    
    if (insertError) {
      console.error('Kategori ekleme hatası:', insertError);
      return false;
    }
    
    console.log('Örnek kategoriler eklendi');
  } else {
    console.log('Kategoriler zaten var, toplam:', existingCategories.length);
  }
  
  return true;
}

// Bu dosya import edildiğinde otomatik olarak tabloları oluştur
// IIFE kullanmadan sadece export edilen fonksiyon
// main index.ts tarafından çağrılacak