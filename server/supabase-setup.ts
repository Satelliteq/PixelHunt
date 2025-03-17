import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Supabase'de tabloları oluşturur
 * SQL sorguları doğrudan Supabase'e gönderilir
 */
export async function setupSupabaseTables() {
  console.log('Supabase tabloları oluşturuluyor...');
  
  try {
    // Tests tablosu
    const { error: testsError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS tests (
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
        );
      `
    });
    
    if (testsError) {
      console.error('Tests tablosu oluşturma hatası:', testsError);
      
      // Alternatif metod
      const { error: testsAltError } = await supabase.from('tests').select('id').limit(1);
      
      if (testsAltError && testsAltError.code === '42P01') {
        console.log('Tests tablosu yok, SQL ile oluşturulacak...');
        
        const { data, error } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        
        if (token) {
          // SQL sorgusu doğrudan yürütmek için özel API çağrısı
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'apikey': supabaseKey
            },
            body: JSON.stringify({
              query: `
                CREATE TABLE IF NOT EXISTS tests (
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
                );
              `
            })
          });
          
          if (!response.ok) {
            console.error('Tests tablosu alternatif yöntemle oluşturulamadı:', await response.text());
          } else {
            console.log('Tests tablosu alternatif yöntemle oluşturuldu');
          }
        } else {
          console.error('Oturum bulunamadı, tablo oluşturulamıyor');
        }
      } else if (testsAltError) {
        console.error('Tests tablosu sorgulama hatası:', testsAltError);
      } else {
        console.log('Tests tablosu zaten var');
      }
    } else {
      console.log('Tests tablosu başarıyla oluşturuldu veya zaten var');
    }
    
    // Categories tablosu
    const { error: categoriesError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          icon_url TEXT
        );
        
        -- Başlangıç kategorileri ekle
        INSERT INTO categories (name, description, icon_url)
        VALUES 
          ('Otomobiller', 'Araçlar ve otomobillerle ilgili testler', 'https://api.iconify.design/mdi:car.svg'),
          ('Coğrafya', 'Haritalar, şehirler ve coğrafi konuları içeren testler', 'https://api.iconify.design/mdi:earth.svg'),
          ('Film ve TV', 'Filmler, diziler ve TV programları hakkında testler', 'https://api.iconify.design/mdi:movie.svg'),
          ('Sanat', 'Tüm sanat dalları ve ilgili testler', 'https://api.iconify.design/mdi:palette.svg')
        ON CONFLICT (name) DO NOTHING;
      `
    });
    
    if (categoriesError) {
      console.error('Categories tablosu oluşturma hatası:', categoriesError);
    } else {
      console.log('Categories tablosu başarıyla oluşturuldu veya zaten var');
    }
    
    // Test sonuçları
    const { error: scoresError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS game_scores (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          test_id INTEGER,
          score INTEGER NOT NULL,
          attempts_count INTEGER DEFAULT 1,
          completion_time INTEGER,
          completed BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (scoresError) {
      console.error('Game_scores tablosu oluşturma hatası:', scoresError);
    } else {
      console.log('Game_scores tablosu başarıyla oluşturuldu veya zaten var');
    }
    
    // Images tablosu
    const { error: imagesError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS images (
          id SERIAL PRIMARY KEY,
          url TEXT NOT NULL,
          category_id INTEGER,
          correct_answers JSONB NOT NULL DEFAULT '[]',
          difficulty INTEGER DEFAULT 1,
          play_count INTEGER DEFAULT 0,
          like_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (imagesError) {
      console.error('Images tablosu oluşturma hatası:', imagesError);
    } else {
      console.log('Images tablosu başarıyla oluşturuldu veya zaten var');
    }
    
    // Users tablosu (var olduğunu kontrol et, yoksa oluştur)
    const { error: usersCheckError } = await supabase.from('users').select('id').limit(1);
    
    if (usersCheckError && usersCheckError.code === '42P01') {
      // Users tablosu yok, oluştur
      const { error: usersError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            score INTEGER DEFAULT 0,
            avatar TEXT,
            role TEXT DEFAULT 'user',
            banned BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (usersError) {
        console.error('Users tablosu oluşturma hatası:', usersError);
      } else {
        console.log('Users tablosu başarıyla oluşturuldu');
      }
    } else if (usersCheckError) {
      console.error('Users tablosu sorgulama hatası:', usersCheckError);
    } else {
      console.log('Users tablosu zaten var');
    }
    
    // Test yorumları
    const { error: commentsError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS test_comments (
          id SERIAL PRIMARY KEY,
          test_id INTEGER NOT NULL,
          user_id INTEGER,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (commentsError) {
      console.error('Test_comments tablosu oluşturma hatası:', commentsError);
    } else {
      console.log('Test_comments tablosu başarıyla oluşturuldu veya zaten var');
    }
    
    // Tablo görünümleri (views)
    const { error: viewsError } = await supabase.rpc('execute_sql', {
      sql_query: `
        -- Popüler testleri görüntülemek için view
        CREATE OR REPLACE VIEW popular_tests AS
        SELECT * FROM tests 
        WHERE published = true AND approved = true
        ORDER BY play_count DESC, like_count DESC;
        
        -- En yeni testleri görüntülemek için view
        CREATE OR REPLACE VIEW newest_tests AS
        SELECT * FROM tests 
        WHERE published = true AND approved = true
        ORDER BY created_at DESC;
        
        -- Öne çıkan testleri görüntülemek için view
        CREATE OR REPLACE VIEW featured_tests AS
        SELECT * FROM tests 
        WHERE published = true AND approved = true
        ORDER BY play_count DESC, like_count DESC;
      `
    });
    
    if (viewsError) {
      console.error('Görünümler oluşturma hatası:', viewsError);
    } else {
      console.log('Görünümler başarıyla oluşturuldu');
    }
    
    // Stored prosedürler
    const { error: proceduresError } = await supabase.rpc('execute_sql', {
      sql_query: `
        -- Popüler testleri getirmek için fonksiyon
        CREATE OR REPLACE FUNCTION get_popular_tests(limit_param INTEGER)
        RETURNS SETOF tests AS $$
        BEGIN
          RETURN QUERY
          SELECT * FROM tests
          WHERE published = true AND approved = true
          ORDER BY play_count DESC, like_count DESC
          LIMIT limit_param;
        END;
        $$ LANGUAGE plpgsql;
        
        -- En yeni testleri getirmek için fonksiyon
        CREATE OR REPLACE FUNCTION get_newest_tests(limit_param INTEGER)
        RETURNS SETOF tests AS $$
        BEGIN
          RETURN QUERY
          SELECT * FROM tests
          WHERE published = true AND approved = true
          ORDER BY created_at DESC
          LIMIT limit_param;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Test oynama sayısını artırmak için fonksiyon
        CREATE OR REPLACE FUNCTION increment_test_play_count(test_id INTEGER)
        RETURNS void AS $$
        BEGIN
          UPDATE tests
          SET play_count = play_count + 1
          WHERE id = test_id;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Test beğeni sayısını artırmak için fonksiyon
        CREATE OR REPLACE FUNCTION increment_test_like_count(test_id INTEGER)
        RETURNS void AS $$
        BEGIN
          UPDATE tests
          SET like_count = like_count + 1
          WHERE id = test_id;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (proceduresError) {
      console.error('Stored prosedürler oluşturma hatası:', proceduresError);
    } else {
      console.log('Stored prosedürler başarıyla oluşturuldu');
    }
    
    console.log('Supabase tablo kurulumu tamamlandı');
    return true;
  } catch (error) {
    console.error('Supabase tablo kurulumu hatası:', error);
    return false;
  }
}

/**
 * Supabase için RLS (Row Level Security) politikaları oluşturur
 */
export async function setupSupabaseRLS() {
  try {
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        -- Tests tablosu için RLS
        ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Herkes testleri görebilir" ON tests;
        CREATE POLICY "Herkes testleri görebilir" ON tests
        FOR SELECT USING (published = true AND approved = true);
        
        DROP POLICY IF EXISTS "Yöneticiler tüm testleri düzenleyebilir" ON tests;
        CREATE POLICY "Yöneticiler tüm testleri düzenleyebilir" ON tests
        FOR ALL USING (
          (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
        );
        
        DROP POLICY IF EXISTS "Kullanıcılar kendi testlerini düzenleyebilir" ON tests;
        CREATE POLICY "Kullanıcılar kendi testlerini düzenleyebilir" ON tests
        FOR ALL USING (
          creator_id::text = auth.uid()
        );
        
        -- Categories tablosu için RLS
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Herkes kategorileri görebilir" ON categories;
        CREATE POLICY "Herkes kategorileri görebilir" ON categories
        FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Yöneticiler kategorileri düzenleyebilir" ON categories;
        CREATE POLICY "Yöneticiler kategorileri düzenleyebilir" ON categories
        FOR ALL USING (
          (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
        );
      `
    });
    
    if (error) {
      console.error('RLS politikaları oluşturma hatası:', error);
      return false;
    }
    
    console.log('RLS politikaları başarıyla oluşturuldu');
    return true;
  } catch (error) {
    console.error('RLS politikaları oluşturma hatası:', error);
    return false;
  }
}

// Bu dosya import edildiğinde otomatik olarak tabloları oluştur
setupSupabaseTables().then(() => {
  console.log('Supabase kurulumu tamamlandı');
});