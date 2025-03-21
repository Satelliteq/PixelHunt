import 'dotenv/config';
import postgres from 'postgres';
import * as schema from './shared/schema';

// PostgreSQL client'ı
const DATABASE_URL = process.env.DATABASE_URL || '';
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Veritabanı bağlantısı
const sql = postgres(DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function main() {
  console.log('Creating tables in Supabase database...');
  
  try {
    // 1. Create users table
    console.log('Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'user',
        score INTEGER DEFAULT 0,
        uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
        avatar TEXT,
        banned BOOLEAN DEFAULT FALSE,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('Users table created or already exists');
    
    // 2. Create categories table
    console.log('Creating categories table...');
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#4F46E5',
        background_color TEXT,
        icon_url TEXT,
        icon_name TEXT,
        "order" INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('Categories table created or already exists');
    
    // 3. Create images table
    console.log('Creating images table...');
    await sql`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        image_url TEXT NOT NULL,
        storage_key TEXT,
        category_id INTEGER REFERENCES categories(id),
        answers JSONB NOT NULL,
        hints JSONB,
        difficulty INTEGER DEFAULT 1,
        play_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      )
    `;
    console.log('Images table created or already exists');
    
    // 4. Create tests table
    console.log('Creating tests table...');
    await sql`
      CREATE TABLE IF NOT EXISTS tests (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        uuid TEXT DEFAULT gen_random_uuid() NOT NULL UNIQUE,
        thumbnail TEXT,
        category_id INTEGER REFERENCES categories(id),
        image_ids JSONB,
        difficulty INTEGER DEFAULT 1,
        creator_id INTEGER REFERENCES users(id),
        play_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT TRUE,
        approved BOOLEAN DEFAULT FALSE,
        published BOOLEAN DEFAULT TRUE,
        featured BOOLEAN DEFAULT FALSE,
        settings JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      )
    `;
    console.log('Tests table created or already exists');
    
    // 5. Create test_comments table
    console.log('Creating test_comments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS test_comments (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES tests(id) NOT NULL,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('Test comments table created or already exists');
    
    // 6. Create game_scores table
    console.log('Creating game_scores table...');
    await sql`
      CREATE TABLE IF NOT EXISTS game_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        test_id INTEGER REFERENCES tests(id) NOT NULL,
        score INTEGER NOT NULL,
        completion_time INTEGER,
        attempts_count INTEGER DEFAULT 1,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('Game scores table created or already exists');
    
    // 7. Create user_activities table
    console.log('Creating user_activities table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        activity_type TEXT NOT NULL,
        activity_data JSONB,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('User activities table created or already exists');
    
    // 8. Create storage buckets if not exists
    console.log('Creating storage buckets...');
    
    console.log('✅ All tables created successfully in Supabase database!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await sql.end();
  }
}

main();