/**
 * Bu script, veritabanı tablolarını ve ilişkilerini kurulu için doğrudan PostgreSQL bağlantısı kullanır
 */

const { Client } = require('pg');
require('dotenv').config();

// Veritabanı bağlantı bilgisi
const connectionString = process.env.DATABASE_URL;

// Ana fonksiyon
async function setupDatabase() {
  console.log('Veritabanı kurulumu başlatılıyor...');
  
  // Veritabanı istemcisi
  const client = new Client({
    connectionString
  });
  
  try {
    // Bağlantı aç
    await client.connect();
    console.log('Veritabanına bağlantı kuruldu');
    
    // Tabloları oluştur
    await client.query(`
      -- Users tablosu
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
    
    await client.query(`
      -- Categories tablosu
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon_url TEXT
      );
    `);
    console.log('Categories tablosu oluşturuldu');
    
    await client.query(`
      -- Images tablosu
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
    
    await client.query(`
      -- Tests tablosu
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
    `);
    console.log('Tests tablosu oluşturuldu');
    
    await client.query(`
      -- Test yorumları tablosu
      CREATE TABLE IF NOT EXISTS test_comments (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Test yorumları tablosu oluşturuldu');
    
    await client.query(`
      -- Oyun skorları tablosu
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
    console.log('Oyun skorları tablosu oluşturuldu');
    
    // Görünümler oluştur
    await client.query(`
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
    `);
    console.log('Görünümler oluşturuldu');
    
    // Stored Procedure'ler oluştur
    await client.query(`
      -- Popüler testleri getir
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
      
      -- En yeni testleri getir
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
      
      -- Test oynanma sayacını artır
      CREATE OR REPLACE FUNCTION increment_test_play_count(test_id INTEGER)
      RETURNS VOID AS $$
      BEGIN
        UPDATE tests
        SET play_count = play_count + 1
        WHERE id = test_id;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Test beğeni sayacını artır
      CREATE OR REPLACE FUNCTION increment_test_like_count(test_id INTEGER)
      RETURNS VOID AS $$
      BEGIN
        UPDATE tests
        SET like_count = like_count + 1
        WHERE id = test_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Stored Procedure\'ler oluşturuldu');
    
    // Örnek kategoriler ekle
    const categoryResult = await client.query(`
      INSERT INTO categories (name, description, icon_url)
      VALUES 
        ('Genel', 'Genel kategori', NULL),
        ('Sanat', 'Sanat kategori', NULL),
        ('Filmler', 'Film ve diziler kategorisi', NULL),
        ('Müzik', 'Müzik kategorisi', NULL),
        ('Spor', 'Spor kategorisi', NULL)
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name;
    `);
    
    if (categoryResult.rows.length > 0) {
      console.log('Örnek kategoriler eklendi:', categoryResult.rows);
    } else {
      console.log('Örnek kategoriler zaten mevcut, hiçbir şey eklenmedi');
    }
    
    console.log('Veritabanı kurulumu başarıyla tamamlandı!');
    return true;
  } catch (error) {
    console.error('Veritabanı kurulum hatası:', error);
    return false;
  } finally {
    await client.end();
    console.log('Veritabanı bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
setupDatabase().then(success => {
  if (success) {
    console.log('Tüm işlemler başarıyla tamamlandı');
    process.exit(0);
  } else {
    console.error('İşlem sırasında hatalar oluştu');
    process.exit(1);
  }
}).catch(err => {
  console.error('Beklenmeyen bir hata oluştu:', err);
  process.exit(1);
});