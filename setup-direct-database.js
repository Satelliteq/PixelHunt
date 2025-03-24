import pkg from 'pg';
import 'dotenv/config';
import { createId } from '@paralleldrive/cuid2';

const { Pool } = pkg;

// PostgreSQL bağlantısı
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runSql(query) {
  const client = await pool.connect();
  try {
    const result = await client.query(query);
    return result;
  } finally {
    client.release();
  }
}

async function checkTables() {
  try {
    const result = await runSql(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Mevcut tablolar:', result.rows.map(row => row.table_name));
    
    return result.rows.map(row => row.table_name);
  } catch (error) {
    console.error('Tablolar kontrol edilirken hata oluştu:', error);
    return [];
  }
}

async function setupDatabase() {
  try {
    console.log('Veritabanı kurulumu başlatılıyor...');
    
    const existingTables = await checkTables();
    
    if (existingTables.length > 0) {
      console.log('Tablolar zaten mevcut. Tabloları silip yeniden oluşturmak istiyor musunuz?');
      // Normalde kullanıcıya sorulur, burada otomatik devam ediyoruz
    }
    
    // Tabloları oluştur
    await runSql(`
      DROP TABLE IF EXISTS game_scores CASCADE;
      DROP TABLE IF EXISTS test_comments CASCADE;
      DROP TABLE IF EXISTS tests CASCADE;
      DROP TABLE IF EXISTS images CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS user_activities CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    
    console.log('Tablolar silindi.');
    
    await runSql(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        score INTEGER DEFAULT 0,
        profile_image_url TEXT,
        banned BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE
      );
      
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon_name VARCHAR(100),
        color VARCHAR(50),
        background_color VARCHAR(50),
        image_url TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE
      );
      
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        image_url TEXT NOT NULL,
        storage_key TEXT,
        category_id INTEGER REFERENCES categories(id),
        answers TEXT[] NOT NULL,
        hints TEXT[],
        difficulty INTEGER DEFAULT 1,
        play_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE
      );
      
      CREATE TABLE IF NOT EXISTS tests (
        id SERIAL PRIMARY KEY,
        uuid VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES categories(id),
        creator_id INTEGER REFERENCES users(id),
        difficulty INTEGER DEFAULT 1,
        duration INTEGER,
        image_url TEXT,
        questions JSONB NOT NULL DEFAULT '[]'::jsonb,
        play_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        approved BOOLEAN DEFAULT false,
        is_public BOOLEAN DEFAULT false,
        featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE
      );
      
      CREATE TABLE IF NOT EXISTS test_comments (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE
      );
      
      CREATE TABLE IF NOT EXISTS game_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        game_mode VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL,
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS user_activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        user_name VARCHAR(100),
        activity_type VARCHAR(100) NOT NULL,
        details TEXT,
        entity_id INTEGER,
        entity_type VARCHAR(50),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Tablolar oluşturuldu.');
    
    // Örnek veriler ekle
    // Admin kullanıcısı
    await runSql(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('admin', 'admin@pixelhunt.com', '$2a$10$rk8vVQDnDxP15oQs03Kqn.ZdLzjS9/0NyeWFRfgvikN4vGJl6VvJu', 'admin');
    `);
    
    console.log('Admin kullanıcısı eklendi.');
    
    // Kategoriler
    await runSql(`
      INSERT INTO categories (name, description, icon_name, color, background_color, active)
      VALUES 
      ('Sanat', 'Resim, heykel ve diğer görsel sanatlar', 'Palette', '#EC4899', '#FCE7F3', true),
      ('Arabalar', 'Otomobil markaları ve modelleri', 'Car', '#EF4444', '#FEF2F2', true),
      ('Filmler', 'Film afişleri ve sahneleri', 'Film', '#6366F1', '#EEF2FF', true),
      ('Bilim', 'Bilimsel içerikler ve buluşlar', 'Flask', '#0EA5E9', '#E0F2FE', true),
      ('Coğrafya', 'Ülkeler, şehirler ve haritalar', 'Globe', '#10B981', '#ECFDF5', true);
    `);
    
    console.log('Kategoriler eklendi.');
    
    // Testler
    const testData = [
      {
        uuid: createId(),
        title: 'Sanat Tarihi Testi',
        description: 'Ünlü eserleri ve sanatçıları ne kadar iyi tanıyorsunuz?',
        category_id: 1, // Sanat
        creator_id: 1, // Admin
        difficulty: 2,
        image_url: 'https://images.unsplash.com/photo-1594026112902-70bf4bfc79d5?w=500',
        questions: JSON.stringify([
          {
            question: 'Bu ünlü tabloyu kim yaptı?',
            image_url: 'https://images.unsplash.com/photo-1594026112902-70bf4bfc79d5',
            options: ['Leonardo da Vinci', 'Vincent van Gogh', 'Pablo Picasso', 'Michelangelo'],
            correct_answer: 0
          },
          {
            question: 'Bu heykelin adı nedir?',
            image_url: 'https://images.unsplash.com/photo-1608083950849-53e1d0d5cc13',
            options: ['David', 'Venüs', 'Düşünen Adam', 'Pieta'],
            correct_answer: 2
          }
        ]),
        play_count: 45,
        like_count: 18,
        approved: true,
        is_public: true,
        featured: true
      },
      {
        uuid: createId(),
        title: 'Araba Logoları Testi',
        description: 'Araba markalarını logolarından tanıyabilecek misiniz?',
        category_id: 2, // Arabalar
        creator_id: 1, // Admin
        difficulty: 1,
        image_url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=500',
        questions: JSON.stringify([
          {
            question: 'Bu araba logosu hangi markaya aittir?',
            image_url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888',
            options: ['Mercedes', 'BMW', 'Audi', 'Volkswagen'],
            correct_answer: 1
          },
          {
            question: 'Bu logo hangi lüks araba markasının?',
            image_url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8',
            options: ['Ferrari', 'Lamborghini', 'Porsche', 'Maserati'],
            correct_answer: 2
          }
        ]),
        play_count: 67,
        like_count: 32,
        approved: true,
        is_public: true,
        featured: true
      },
      {
        uuid: createId(),
        title: 'Film Karakterleri Testi',
        description: 'Ünlü film karakterlerini tanıyabilecek misiniz?',
        category_id: 3, // Filmler
        creator_id: 1, // Admin
        difficulty: 3,
        image_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500',
        questions: JSON.stringify([
          {
            question: 'Bu karakter hangi filmdendir?',
            image_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728',
            options: ['Star Wars', 'Indiana Jones', 'Jurassic Park', 'Matrix'],
            correct_answer: 0
          },
          {
            question: 'Bu ünlü sahne hangi filmdendir?',
            image_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1',
            options: ['Titanic', 'Avatar', 'The Godfather', 'Pulp Fiction'],
            correct_answer: 3
          }
        ]),
        play_count: 89,
        like_count: 41,
        approved: true,
        is_public: true,
        featured: true
      }
    ];
    
    for (const test of testData) {
      await runSql(`
        INSERT INTO tests (uuid, title, description, category_id, creator_id, difficulty, image_url, questions, play_count, like_count, approved, is_public, featured)
        VALUES ('${test.uuid}', '${test.title}', '${test.description}', ${test.category_id}, ${test.creator_id}, ${test.difficulty}, '${test.image_url}', '${test.questions}', ${test.play_count}, ${test.like_count}, ${test.approved}, ${test.is_public}, ${test.featured})
      `);
    }
    
    console.log('Testler eklendi.');
    
    // Resimler
    await runSql(`
      INSERT INTO images (title, image_url, category_id, answers, difficulty, play_count, like_count, active, created_by)
      VALUES 
      ('Mona Lisa', 'https://images.unsplash.com/photo-1594026112902-70bf4bfc79d5', 1, ARRAY['Mona Lisa', 'La Gioconda'], 2, 125, 78, true, 1),
      ('BMW Logosu', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888', 2, ARRAY['BMW', 'Bayerische Motoren Werke'], 1, 88, 45, true, 1),
      ('Star Wars', 'https://images.unsplash.com/photo-1485846234645-a62644f84728', 3, ARRAY['Star Wars', 'Yıldız Savaşları'], 3, 145, 92, true, 1);
    `);
    
    console.log('Resimler eklendi.');
    
    console.log('Veritabanı kurulumu tamamlandı!');
  } catch (error) {
    console.error('Veritabanı kurulumu sırasında hata oluştu:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();