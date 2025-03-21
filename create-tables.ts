import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema';

// PostgreSQL client'ı
const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const client = postgres(connectionString, {
  ssl: { rejectUnauthorized: false }
});

// Drizzle ORM instance
const db = drizzle(client, { schema });

async function main() {
  console.log('Creating tables...');
  
  try {
    // Users tablosu
    await client`
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
    `;
    console.log('✅ Users table created');
    
    // Categories tablosu
    await client`
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
    `;
    console.log('✅ Categories table created');
    
    // Images tablosu
    await client`
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
    `;
    console.log('✅ Images table created');
    
    // Tests tablosu
    await client`
      CREATE TABLE IF NOT EXISTS tests (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        creator_id INTEGER REFERENCES users(id),
        category_id INTEGER REFERENCES categories(id),
        image_ids JSONB NOT NULL,
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
    `;
    console.log('✅ Tests table created');
    
    // Test yorumları tablosu
    await client`
      CREATE TABLE IF NOT EXISTS test_comments (
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL REFERENCES tests(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Test comments table created');
    
    // Oyun skorları tablosu
    await client`
      CREATE TABLE IF NOT EXISTS game_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        test_id INTEGER NOT NULL REFERENCES tests(id),
        completion_time INTEGER,
        attempts_count INTEGER NOT NULL,
        score INTEGER NOT NULL,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Game scores table created');
    
    // Kullanıcı aktiviteleri tablosu
    await client`
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
    `;
    console.log('✅ User activities table created');
    
    console.log('✅ All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await client.end();
  }
}

main();