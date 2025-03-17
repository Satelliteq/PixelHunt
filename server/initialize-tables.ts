import { supabase } from './supabase-setup';
import * as fs from 'fs';
import * as path from 'path';

/**
 * This utility function tries to create tables using Supabase JavaScript client
 * Can be run directly to initialize all required tables
 */
export async function initializeSupabaseTables() {
  try {
    console.log('Supabase tabloları başlatılıyor...');
    
    // Read SQL script from file
    const sqlFile = path.join(__dirname, '..', 'scripts', 'supabase-tables.sql');
    
    if (!fs.existsSync(sqlFile)) {
      console.error('SQL dosyası bulunamadı:', sqlFile);
      return false;
    }
    
    const sqlScript = fs.readFileSync(sqlFile, 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.error('SQL çalıştırma hatası:', error);
          console.error('Hataya sebep olan sorgu:', statement);
          // Continue with next statement
        }
      } catch (stmtError) {
        console.error('Sorgu çalıştırma hatası:', stmtError);
      }
    }
    
    console.log('SQL komutları çalıştırılmaya çalışıldı');
    
    // Try to directly create tables
    await createCategoriesTable();
    await createUsersTable();
    await createImagesTable();
    await createTestsTable();
    await createTestCommentsTable();
    await createGameScoresTable();
    
    console.log('Supabase tablo başlatma işlemi tamamlandı');
    return true;
  } catch (error) {
    console.error('Supabase tabloları başlatma hatası:', error);
    return false;
  }
}

/**
 * Create categories table
 */
async function createCategoriesTable() {
  try {
    console.log('Categories tablosu oluşturuluyor...');
    const { error } = await supabase.from('categories').select('count').limit(1);
    
    if (error && error.code === '42P01') {  // Table doesn't exist
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            icon_url TEXT
          );
        `
      });
      
      if (createError) {
        console.error('Categories tablosu oluşturma hatası:', createError);
      } else {
        console.log('Categories tablosu başarıyla oluşturuldu');
      }
    } else if (error) {
      console.error('Categories tablosu sorgulama hatası:', error);
    } else {
      console.log('Categories tablosu zaten mevcut');
    }
  } catch (error) {
    console.error('Categories tablo işlemi hatası:', error);
  }
}

/**
 * Create users table
 */
async function createUsersTable() {
  try {
    console.log('Users tablosu oluşturuluyor...');
    const { error } = await supabase.from('users').select('count').limit(1);
    
    if (error && error.code === '42P01') {  // Table doesn't exist
      const { error: createError } = await supabase.rpc('exec_sql', {
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
      
      if (createError) {
        console.error('Users tablosu oluşturma hatası:', createError);
      } else {
        console.log('Users tablosu başarıyla oluşturuldu');
      }
    } else if (error) {
      console.error('Users tablosu sorgulama hatası:', error);
    } else {
      console.log('Users tablosu zaten mevcut');
    }
  } catch (error) {
    console.error('Users tablo işlemi hatası:', error);
  }
}

/**
 * Create images table
 */
async function createImagesTable() {
  try {
    console.log('Images tablosu oluşturuluyor...');
    const { error } = await supabase.from('images').select('count').limit(1);
    
    if (error && error.code === '42P01') {  // Table doesn't exist
      const { error: createError } = await supabase.rpc('exec_sql', {
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
      
      if (createError) {
        console.error('Images tablosu oluşturma hatası:', createError);
      } else {
        console.log('Images tablosu başarıyla oluşturuldu');
      }
    } else if (error) {
      console.error('Images tablosu sorgulama hatası:', error);
    } else {
      console.log('Images tablosu zaten mevcut');
    }
  } catch (error) {
    console.error('Images tablo işlemi hatası:', error);
  }
}

/**
 * Create tests table
 */
async function createTestsTable() {
  try {
    console.log('Tests tablosu oluşturuluyor...');
    const { error } = await supabase.from('tests').select('count').limit(1);
    
    if (error && error.code === '42P01') {  // Table doesn't exist
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql_query: `
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
        `
      });
      
      if (createError) {
        console.error('Tests tablosu oluşturma hatası:', createError);
      } else {
        console.log('Tests tablosu başarıyla oluşturuldu');
      }
    } else if (error) {
      console.error('Tests tablosu sorgulama hatası:', error);
    } else {
      console.log('Tests tablosu zaten mevcut');
    }
  } catch (error) {
    console.error('Tests tablo işlemi hatası:', error);
  }
}

/**
 * Create test_comments table
 */
async function createTestCommentsTable() {
  try {
    console.log('Test_comments tablosu oluşturuluyor...');
    const { error } = await supabase.from('test_comments').select('count').limit(1);
    
    if (error && error.code === '42P01') {  // Table doesn't exist
      const { error: createError } = await supabase.rpc('exec_sql', {
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
      
      if (createError) {
        console.error('Test_comments tablosu oluşturma hatası:', createError);
      } else {
        console.log('Test_comments tablosu başarıyla oluşturuldu');
      }
    } else if (error) {
      console.error('Test_comments tablosu sorgulama hatası:', error);
    } else {
      console.log('Test_comments tablosu zaten mevcut');
    }
  } catch (error) {
    console.error('Test_comments tablo işlemi hatası:', error);
  }
}

/**
 * Create game_scores table
 */
async function createGameScoresTable() {
  try {
    console.log('Game_scores tablosu oluşturuluyor...');
    const { error } = await supabase.from('game_scores').select('count').limit(1);
    
    if (error && error.code === '42P01') {  // Table doesn't exist
      const { error: createError } = await supabase.rpc('exec_sql', {
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
      
      if (createError) {
        console.error('Game_scores tablosu oluşturma hatası:', createError);
      } else {
        console.log('Game_scores tablosu başarıyla oluşturuldu');
      }
    } else if (error) {
      console.error('Game_scores tablosu sorgulama hatası:', error);
    } else {
      console.log('Game_scores tablosu zaten mevcut');
    }
  } catch (error) {
    console.error('Game_scores tablo işlemi hatası:', error);
  }
}

// ES modules için doğrudan çalıştırma kontrolü
if (import.meta.url === (typeof document === 'undefined' ? new URL(process.argv[1], 'file:').href : undefined)) {
  initializeSupabaseTables().then(() => {
    console.log('Tablo başlatma işlemi tamamlandı');
    process.exit(0);
  }).catch(err => {
    console.error('Tablo başlatma hatası:', err);
    process.exit(1);
  });
}