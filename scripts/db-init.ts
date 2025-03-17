/**
 * Bu dosya, veritabanı tablolarını Supabase üzerinde oluşturmak için kullanılır.
 * Doğrudan SQL komutları ve Supabase API birlikte kullanılır.
 */

import { createClient } from '@supabase/supabase-js';
import { exit } from 'process';
import 'dotenv/config';

// Supabase bağlantı bilgileri
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL ve SUPABASE_ANON_KEY çevre değişkenleri ayarlanmalıdır.');
  exit(1);
}

// Supabase istemcisi oluştur
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Tüm tabloları oluşturur
 */
async function createTables() {
  console.log('Tablolar oluşturuluyor...');
  
  try {
    // Users tablosu
    const { error: usersError } = await supabase.from('users').select('count').limit(1);
    if (usersError && usersError.code === '42P01') {
      // Tablo yok, oluşturalım
      const { error } = await supabase.rpc('create_table_users');
      if (error) {
        console.log('Direkt SQL kullanarak users tablosunu oluşturmayı deniyoruz...');
        const { error: sqlError } = await supabase.rpc('execute_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS users (
              id SERIAL PRIMARY KEY,
              username TEXT NOT NULL UNIQUE,
              password TEXT NOT NULL,
              score INTEGER DEFAULT 0,
              avatar TEXT,
              role TEXT DEFAULT 'user',
              banned BOOLEAN DEFAULT false,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `
        });
        
        if (sqlError) {
          console.error('Users tablosu oluşturma hatası:', sqlError);
        } else {
          console.log('Users tablosu SQL ile oluşturuldu');
        }
      } else {
        console.log('Users tablosu RPC ile oluşturuldu');
      }
    } else {
      console.log('Users tablosu zaten var');
    }
    
    // Categories tablosu
    const { error: categoriesError } = await supabase.from('categories').select('count').limit(1);
    if (categoriesError && categoriesError.code === '42P01') {
      // Tablo yok, oluşturalım
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            icon_url TEXT
          );
        `
      });
      
      if (error) {
        console.error('Categories tablosu oluşturma hatası:', error);
      } else {
        console.log('Categories tablosu oluşturuldu');
        
        // Örnek kategoriler ekleyelim
        const { error: insertError } = await supabase.from('categories').insert([
          { name: 'Genel', description: 'Genel kategori' },
          { name: 'Sanat', description: 'Sanat kategori' },
          { name: 'Filmler', description: 'Film ve diziler kategorisi' },
          { name: 'Müzik', description: 'Müzik kategorisi' },
          { name: 'Spor', description: 'Spor kategorisi' }
        ]);
        
        if (insertError) {
          console.error('Örnek kategori ekleme hatası:', insertError);
        } else {
          console.log('Örnek kategoriler eklendi');
        }
      }
    } else {
      console.log('Categories tablosu zaten var');
    }
    
    // Images tablosu
    const { error: imagesError } = await supabase.from('images').select('count').limit(1);
    if (imagesError && imagesError.code === '42P01') {
      // Tablo yok, oluşturalım
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS images (
            id SERIAL PRIMARY KEY,
            url TEXT NOT NULL,
            answers JSONB NOT NULL,
            category_id INTEGER REFERENCES categories(id),
            play_count INTEGER DEFAULT 0,
            like_count INTEGER DEFAULT 0,
            difficulty INTEGER DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (error) {
        console.error('Images tablosu oluşturma hatası:', error);
      } else {
        console.log('Images tablosu oluşturuldu');
      }
    } else {
      console.log('Images tablosu zaten var');
    }
    
    // Tests tablosu
    const { error: testsError } = await supabase.from('tests').select('count').limit(1);
    if (testsError && testsError.code === '42P01') {
      // Tablo yok, oluşturalım
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS tests (
            id SERIAL PRIMARY KEY,
            uuid TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            description TEXT,
            category_id INTEGER REFERENCES categories(id),
            creator_id INTEGER REFERENCES users(id),
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
        `
      });
      
      if (error) {
        console.error('Tests tablosu oluşturma hatası:', error);
      } else {
        console.log('Tests tablosu oluşturuldu');
      }
    } else {
      console.log('Tests tablosu zaten var');
    }
    
    // Test yorumları tablosu
    const { error: testCommentsError } = await supabase.from('test_comments').select('count').limit(1);
    if (testCommentsError && testCommentsError.code === '42P01') {
      // Tablo yok, oluşturalım
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS test_comments (
            id SERIAL PRIMARY KEY,
            test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id),
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (error) {
        console.error('Test yorumları tablosu oluşturma hatası:', error);
      } else {
        console.log('Test yorumları tablosu oluşturuldu');
      }
    } else {
      console.log('Test yorumları tablosu zaten var');
    }
    
    // Oyun skorları tablosu
    const { error: gameScoresError } = await supabase.from('game_scores').select('count').limit(1);
    if (gameScoresError && gameScoresError.code === '42P01') {
      // Tablo yok, oluşturalım
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS game_scores (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
            score INTEGER NOT NULL,
            completion_time INTEGER,
            attempts_count INTEGER NOT NULL,
            completed BOOLEAN DEFAULT false,
            mode TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (error) {
        console.error('Oyun skorları tablosu oluşturma hatası:', error);
      } else {
        console.log('Oyun skorları tablosu oluşturuldu');
      }
    } else {
      console.log('Oyun skorları tablosu zaten var');
    }
    
    // Görünümler oluştur
    try {
      const { error: viewsError } = await supabase.rpc('execute_sql', {
        sql_query: `
          -- Popüler testler view
          CREATE OR REPLACE VIEW popular_tests AS
          SELECT * FROM tests 
          WHERE published = true AND approved = true
          ORDER BY play_count DESC;
          
          -- En yeni testler view
          CREATE OR REPLACE VIEW newest_tests AS
          SELECT * FROM tests 
          WHERE published = true AND approved = true
          ORDER BY created_at DESC;
          
          -- Öne çıkan testler view
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
    } catch (viewError) {
      console.error('Görünümler oluşturma işlemi başarısız:', viewError);
    }
    
    // Fonksiyonlar oluştur
    try {
      const { error: functionsError } = await supabase.rpc('execute_sql', {
        sql_query: `
          -- Popüler testleri getir
          CREATE OR REPLACE FUNCTION public.get_popular_tests(limit_param INTEGER)
          RETURNS SETOF tests AS $$
          BEGIN
            RETURN QUERY
            SELECT * FROM tests 
            WHERE published = true AND approved = true
            ORDER BY play_count DESC
            LIMIT limit_param;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
          
          -- En yeni testleri getir
          CREATE OR REPLACE FUNCTION public.get_newest_tests(limit_param INTEGER)
          RETURNS SETOF tests AS $$
          BEGIN
            RETURN QUERY
            SELECT * FROM tests 
            WHERE published = true AND approved = true
            ORDER BY created_at DESC
            LIMIT limit_param;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
          
          -- Test oynanma sayacını artır
          CREATE OR REPLACE FUNCTION public.increment_test_play_count(test_id INTEGER)
          RETURNS VOID AS $$
          BEGIN
            UPDATE tests
            SET play_count = play_count + 1
            WHERE id = test_id;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
          
          -- Test beğeni sayacını artır
          CREATE OR REPLACE FUNCTION public.increment_test_like_count(test_id INTEGER)
          RETURNS VOID AS $$
          BEGIN
            UPDATE tests
            SET like_count = like_count + 1
            WHERE id = test_id;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });
      
      if (functionsError) {
        console.error('Fonksiyonlar oluşturma hatası:', functionsError);
      } else {
        console.log('Fonksiyonlar başarıyla oluşturuldu');
      }
    } catch (funcError) {
      console.error('Fonksiyonlar oluşturma işlemi başarısız:', funcError);
    }
    
    console.log('Tüm tablolar, görünümler ve fonksiyonlar oluşturuldu veya zaten var.');
    return true;
  } catch (error) {
    console.error('Tablo oluşturma hatası:', error);
    return false;
  }
}

async function main() {
  console.log('Veritabanı kurulum işlemi başlatılıyor...');
  
  try {
    // NOT: JavaScript Client üzerinden doğrudan SQL fonksiyonu çalıştıramıyoruz
    // Bu nedenle RPC fonksiyonları üzerinden çalışmalıyız
    console.log('Doğrudan Supabase API ile tablolara erişim deneniyor...');
    
    // Tabloları oluştur
    await createTables();
    
    console.log('Veritabanı kurulumu tamamlandı!');
    return true;
  } catch (error) {
    console.error('Veritabanı kurulum hatası:', error);
    return false;
  }
}

// Scripti doğrudan çalıştır
main().then(success => {
  if (success) {
    console.log('Veritabanı başarıyla kuruldu ve yapılandırıldı');
    exit(0);
  } else {
    console.error('Veritabanı kurulumu başarısız!');
    exit(1);
  }
}).catch(err => {
  console.error('Beklenmeyen hata:', err);
  exit(1);
});