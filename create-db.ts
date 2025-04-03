import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { createId } from '@paralleldrive/cuid2';

// Supabase bağlantısı
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Doğrudan SQL sorgusu çalıştırmak için PostgreSQL istemcisi
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executeSql(query: string): Promise<any> {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(query);
      return result;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Sorgu çalıştırma hatası:', error);
    throw error;
  }
}

// Tabloları oluştur
async function createTables() {
  const queries = [
    // Önce tabloları siliyoruz
    `DROP TABLE IF EXISTS game_scores CASCADE;`,
    `DROP TABLE IF EXISTS test_comments CASCADE;`,
    `DROP TABLE IF EXISTS tests CASCADE;`,
    `DROP TABLE IF EXISTS images CASCADE;`,
    `DROP TABLE IF EXISTS categories CASCADE;`,
    `DROP TABLE IF EXISTS user_activities CASCADE;`,
    `DROP TABLE IF EXISTS users CASCADE;`,
    
    // Kullanıcılar tablosu
    `CREATE TABLE IF NOT EXISTS users (
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
    );`,
    
    // Kategoriler tablosu
    `CREATE TABLE IF NOT EXISTS categories (
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
    );`,
    
    // Görüntüler tablosu
    `CREATE TABLE IF NOT EXISTS images (
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
    );`,
    
    // Testler tablosu
    `CREATE TABLE IF NOT EXISTS tests (
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
    );`,
    
    // Test yorumları tablosu
    `CREATE TABLE IF NOT EXISTS test_comments (
      id SERIAL PRIMARY KEY,
      test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE
    );`,
    
    // Oyun puanları tablosu
    `CREATE TABLE IF NOT EXISTS game_scores (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      game_mode VARCHAR(50) NOT NULL,
      score INTEGER NOT NULL,
      details JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    
    // Kullanıcı aktiviteleri tablosu
    `CREATE TABLE IF NOT EXISTS user_activities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      user_name VARCHAR(100),
      activity_type VARCHAR(100) NOT NULL,
      details TEXT,
      entity_id INTEGER,
      entity_type VARCHAR(50),
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`
  ];

  for (const query of queries) {
    try {
      await executeSql(query);
      console.log('Sorgu başarıyla çalıştırıldı:', query.substring(0, 40) + '...');
    } catch (error) {
      console.error('Sorgu çalıştırma hatası:', error);
    }
  }
}

// Örnek kategorileri ekle
async function createCategories() {
  const categories = [
    {
      name: 'Sanat',
      description: 'Resim, heykel ve diğer görsel sanatlar',
      icon_name: 'palette',
      color: '#EC4899',
      background_color: '#FCE7F3',
      active: true
    },
    {
      name: 'Arabalar',
      description: 'Otomobil markaları ve modelleri',
      icon_name: 'car',
      color: '#EF4444',
      background_color: '#FEF2F2',
      active: true
    },
    {
      name: 'Filmler',
      description: 'Film afişleri ve sahneleri',
      icon_name: 'film',
      color: '#6366F1',
      background_color: '#EEF2FF',
      active: true
    },
    {
      name: 'Bilim',
      description: 'Bilimsel içerikler ve buluşlar',
      icon_name: 'flask',
      color: '#0EA5E9',
      background_color: '#E0F2FE',
      active: true
    },
    {
      name: 'Coğrafya',
      description: 'Ülkeler, şehirler ve haritalar',
      icon_name: 'globe',
      color: '#10B981',
      background_color: '#ECFDF5',
      active: true
    }
  ];

  for (const category of categories) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select();
        
      if (error) {
        console.error('Kategori ekleme hatası:', error);
      } else {
        console.log('Kategori eklendi:', data);
      }
    } catch (error) {
      console.error('Kategori ekleme hatası:', error);
    }
  }
}

// Örnek testleri ekle
async function createTests() {
  try {
    // Kategori ID'lerini al
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .order('id');
      
    if (catError || !categories || categories.length === 0) {
      console.error('Kategoriler bulunamadı:', catError);
      return;
    }
    
    // Testleri oluştur
    const tests = [
      {
        uuid: createId(),
        title: 'Sanat Tarihi Testi',
        description: 'Ünlü eserleri ve sanatçıları ne kadar iyi tanıyorsunuz?',
        category_id: categories[0].id,
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
        category_id: categories[1].id,
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
        category_id: categories[2].id,
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
    
    for (const test of tests) {
      const { data, error } = await supabase
        .from('tests')
        .insert(test)
        .select();
        
      if (error) {
        console.error('Test ekleme hatası:', error);
      } else {
        console.log('Test eklendi:', data);
      }
    }
    
  } catch (error) {
    console.error('Test oluşturma hatası:', error);
  }
}

// Ana işlev
async function main() {
  try {
    console.log('Veritabanı tabloları oluşturuluyor...');
    await createTables();
    
    console.log('Örnek kategoriler ekleniyor...');
    await createCategories();
    
    console.log('Örnek testler ekleniyor...');
    await createTests();
    
    console.log('Veritabanı kurulumu tamamlandı!');
  } catch (error) {
    console.error('Ana işlevde hata:', error);
  } finally {
    await pool.end();
  }
}

main();