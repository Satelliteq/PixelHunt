import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// PostgreSQL client'ı
const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const client = postgres(connectionString, {
  ssl: { rejectUnauthorized: false }
});

async function updateSchema() {
  console.log('Updating database schema...');
  
  try {
    // Users tablosuna eksik sütunları ekle
    console.log('Updating users table...');
    const usersColumns = await client`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users'
    `;
    
    const userColumnNames = usersColumns.map(col => col.column_name);
    
    if (!userColumnNames.includes('uuid')) {
      console.log('Adding uuid column to users table...');
      await client`
        ALTER TABLE users 
        ADD COLUMN uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE
      `;
    }
    
    if (!userColumnNames.includes('email')) {
      console.log('Adding email column to users table...');
      await client`
        ALTER TABLE users 
        ADD COLUMN email TEXT UNIQUE
      `;
    }
    
    if (!userColumnNames.includes('last_login_at')) {
      console.log('Adding last_login_at column to users table...');
      await client`
        ALTER TABLE users 
        ADD COLUMN last_login_at TIMESTAMP
      `;
    }
    
    // Categories tablosuna eksik sütunları ekle
    console.log('Updating categories table...');
    const categoriesColumns = await client`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'categories'
    `;
    
    const categoryColumnNames = categoriesColumns.map(col => col.column_name);
    
    if (!categoryColumnNames.includes('icon_name')) {
      console.log('Adding icon_name column to categories table...');
      await client`
        ALTER TABLE categories 
        ADD COLUMN icon_name TEXT
      `;
    }
    
    if (!categoryColumnNames.includes('color')) {
      console.log('Adding color column to categories table...');
      await client`
        ALTER TABLE categories 
        ADD COLUMN color TEXT DEFAULT '#4F46E5'
      `;
    }
    
    if (!categoryColumnNames.includes('background_color')) {
      console.log('Adding background_color column to categories table...');
      await client`
        ALTER TABLE categories 
        ADD COLUMN background_color TEXT
      `;
    }
    
    if (!categoryColumnNames.includes('order')) {
      console.log('Adding order column to categories table...');
      await client`
        ALTER TABLE categories 
        ADD COLUMN "order" INTEGER DEFAULT 0
      `;
    }
    
    if (!categoryColumnNames.includes('active')) {
      console.log('Adding active column to categories table...');
      await client`
        ALTER TABLE categories 
        ADD COLUMN active BOOLEAN DEFAULT true
      `;
    }
    
    if (!categoryColumnNames.includes('created_at')) {
      console.log('Adding created_at column to categories table...');
      await client`
        ALTER TABLE categories 
        ADD COLUMN created_at TIMESTAMP DEFAULT NOW()
      `;
    }
    
    // Images tablosuna eksik sütunları ekle
    console.log('Updating images table...');
    const imagesColumns = await client`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'images'
    `;
    
    const imageColumnNames = imagesColumns.map(col => col.column_name);
    
    if (!imageColumnNames.includes('image_url')) {
      console.log('Adding image_url column to images table...');
      await client`
        ALTER TABLE images 
        ADD COLUMN image_url TEXT
      `;
      
      // Mevcut kayıtlar için image_url'yi güncelle
      await client`
        UPDATE images SET image_url = 'https://via.placeholder.com/800x600'
        WHERE image_url IS NULL
      `;
      
      // image_url sütununu NOT NULL yap
      await client`
        ALTER TABLE images 
        ALTER COLUMN image_url SET NOT NULL
      `;
    }
    
    if (!imageColumnNames.includes('storage_key')) {
      console.log('Adding storage_key column to images table...');
      await client`
        ALTER TABLE images 
        ADD COLUMN storage_key TEXT
      `;
    }
    
    if (!imageColumnNames.includes('hints')) {
      console.log('Adding hints column to images table...');
      await client`
        ALTER TABLE images 
        ADD COLUMN hints JSONB
      `;
    }
    
    if (!imageColumnNames.includes('active')) {
      console.log('Adding active column to images table...');
      await client`
        ALTER TABLE images 
        ADD COLUMN active BOOLEAN DEFAULT true
      `;
    }
    
    if (!imageColumnNames.includes('created_by')) {
      console.log('Adding created_by column to images table...');
      await client`
        ALTER TABLE images 
        ADD COLUMN created_by INTEGER REFERENCES users(id)
      `;
    }
    
    if (!imageColumnNames.includes('updated_at')) {
      console.log('Adding updated_at column to images table...');
      await client`
        ALTER TABLE images 
        ADD COLUMN updated_at TIMESTAMP
      `;
    }
    
    // Tests tablosuna eksik sütunları ekle
    console.log('Updating tests table...');
    const testsColumns = await client`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'tests'
    `;
    
    const testColumnNames = testsColumns.map(col => col.column_name);
    
    if (!testColumnNames.includes('featured')) {
      console.log('Adding featured column to tests table...');
      await client`
        ALTER TABLE tests 
        ADD COLUMN featured BOOLEAN DEFAULT false
      `;
    }
    
    if (!testColumnNames.includes('updated_at')) {
      console.log('Adding updated_at column to tests table...');
      await client`
        ALTER TABLE tests 
        ADD COLUMN updated_at TIMESTAMP
      `;
    }
    
    if (!testColumnNames.includes('settings')) {
      console.log('Adding settings column to tests table...');
      await client`
        ALTER TABLE tests 
        ADD COLUMN settings JSONB
      `;
    }
    
    console.log('✅ Database schema updated successfully!');
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
  } finally {
    await client.end();
  }
}

updateSchema();