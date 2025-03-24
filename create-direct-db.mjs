// ES Module syntax
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

// Veritabanı bağlantı bilgileri
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function createTables() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Users tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE,
        score INTEGER DEFAULT 0,
        avatar TEXT,
        role TEXT DEFAULT 'user',
        banned BOOLEAN DEFAULT false,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');
    
    // Categories tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon_url TEXT,
        icon_name TEXT,
        color TEXT DEFAULT '#4F46E5',
        background_color TEXT,
        "order" INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Categories table created');
    
    // Images tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        image_url TEXT NOT NULL,
        storage_key TEXT,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        answers JSONB NOT NULL,
        hints JSONB,
        difficulty INTEGER DEFAULT 1,
        play_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id),
        updated_at TIMESTAMP
      )
    `);
    console.log('✅ Images table created');
    
    // Tests tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS tests (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        creator_id INTEGER REFERENCES users(id),
        category_id INTEGER REFERENCES categories(id),
        image_ids JSONB NOT NULL,
        questions JSONB,
        play_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT true,
        approved BOOLEAN DEFAULT false,
        featured BOOLEAN DEFAULT false,
        difficulty INTEGER DEFAULT 2,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        thumbnail TEXT,
        settings JSONB
      )
    `);
    console.log('✅ Tests table created');
    
    // Test yorumları tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_comments (
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL REFERENCES tests(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Test comments table created');
    
    // Oyun skorları tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        game_mode TEXT NOT NULL,
        score INTEGER NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Game scores table created');
    
    // Kullanıcı aktiviteleri tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        user_name TEXT,
        activity_type TEXT NOT NULL,
        details TEXT,
        entity_id INTEGER,
        entity_type TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ User activities table created');

    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

async function insertSampleData() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database for sample data insertion');

    // Örnek kategoriler ekleme
    const categoryResult = await client.query(`
      INSERT INTO categories (name, description, icon_name, color, background_color, active)
      VALUES 
        ('Arabalar', 'Otomobil markaları ve modelleri', 'car', '#EF4444', '#FEF2F2', true),
        ('Coğrafya', 'Dünya üzerindeki yerler ve landmark''lar', 'map', '#3B82F6', '#EFF6FF', true),
        ('Film & TV', 'Filmler, TV şovları ve karakterler', 'film', '#8B5CF6', '#F5F3FF', true),
        ('Sanat', 'Ünlü sanat eserleri ve sanatçılar', 'palette', '#EC4899', '#FDF2F8', true),
        ('Müzik', 'Şarkıcılar, gruplar ve albümler', 'music', '#10B981', '#ECFDF5', true)
      RETURNING id, name
    `);
    console.log('✅ Sample categories added:', categoryResult.rows);

    // Kullanıcı ekleme (admin)
    const userResult = await client.query(`
      INSERT INTO users (uuid, username, password, email, role, score)
      VALUES (
        '5d946ebe-c6b0-4488-801a-f4b1e67138bb', 
        'admin', 
        'adminpass', 
        'admin@example.com', 
        'admin', 
        1000
      )
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username
    `);
    console.log('✅ Admin user added:', userResult.rows);

    // Örnek test
    if (categoryResult.rows.length > 0) {
      const categoryId = categoryResult.rows[0].id;
      
      const testResult = await client.query(`
        INSERT INTO tests (title, description, category_id, image_ids, questions, creator_id, difficulty, featured, approved, is_public)
        VALUES (
          'Klasik Filmler Testi', 
          'Tüm zamanların en iyi filmlerini tahmin edin', 
          $1, 
          '[1, 2, 3]'::jsonb, 
          '[]'::jsonb,
          (SELECT id FROM users WHERE username = 'admin' LIMIT 1),
          3,
          true,
          true,
          true
        )
        ON CONFLICT DO NOTHING
        RETURNING id, title
      `, [categoryId]);
      console.log('✅ Sample test added:', testResult.rows);
    }

    console.log('All sample data inserted successfully!');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

async function main() {
  try {
    await createTables();
    await insertSampleData();
  } catch (err) {
    console.error('Script execution failed:', err);
  }
}

main();