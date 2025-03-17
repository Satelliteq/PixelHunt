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
    // İlk olarak kategoriler tablosunu oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon_url TEXT
      );
    `);
    console.log('Categories tablosu oluşturuldu');
    
    // Kullanıcılar tablosunu oluştur
    await pool.query(`
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
    `);
    console.log('Users tablosu oluşturuldu');
    
    // Görseller tablosunu oluştur
    await pool.query(`
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
    `);
    console.log('Images tablosu oluşturuldu');
    
    // Testler tablosunu oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tests (
        id SERIAL PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES categories(id),
        creator_id INTEGER REFERENCES users(id),
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
      CREATE TABLE IF NOT EXISTS test_comments (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Test_comments tablosu oluşturuldu');
    
    // Oyun skorları tablosunu oluştur
    await pool.query(`
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
    `);
    console.log('Game_scores tablosu oluşturuldu');
    
    // Görünümler oluştur
    await pool.query(`
      CREATE OR REPLACE VIEW popular_tests AS
      SELECT * FROM tests 
      WHERE published = true AND approved = true
      ORDER BY play_count DESC;
    `);
    
    await pool.query(`
      CREATE OR REPLACE VIEW newest_tests AS
      SELECT * FROM tests 
      WHERE published = true AND approved = true
      ORDER BY created_at DESC;
    `);
    
    await pool.query(`
      CREATE OR REPLACE VIEW featured_tests AS
      SELECT * FROM tests 
      WHERE published = true AND approved = true
      ORDER BY play_count DESC, like_count DESC;
    `);
    console.log('Görünümler oluşturuldu');
    
    // Stored prosedürleri oluştur
    await pool.query(`
      CREATE OR REPLACE FUNCTION get_popular_tests(limit_param INTEGER)
      RETURNS SETOF tests AS $$
      BEGIN
        RETURN QUERY
        SELECT * FROM tests 
        WHERE published = true AND approved = true
        ORDER BY play_count DESC
        LIMIT limit_param;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await pool.query(`
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
    `);
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Stored prosedürler oluşturuldu');
    
    // Hızlı test kategorisi oluştur
    try {
      await pool.query(`
        INSERT INTO categories (name, description, icon_url)
        VALUES ('Genel', 'Genel kategorisi', 'https://example.com/icon.png')
        ON CONFLICT (name) DO NOTHING;
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