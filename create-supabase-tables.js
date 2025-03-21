import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase bağlantısı
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTables() {
  try {
    // Tabloları oluştur
    console.log('Creating tables in Supabase...');
    
    // 1. users table
    const { error: usersError } = await supabase.rpc('create_users_table_if_not_exists');
    if (usersError) {
      console.error('Error creating users table:', usersError);
    } else {
      console.log('Users table created or already exists');
    }
    
    // 2. categories table
    const { error: categoriesError } = await supabase.rpc('create_categories_table_if_not_exists');
    if (categoriesError) {
      console.error('Error creating categories table:', categoriesError);
    } else {
      console.log('Categories table created or already exists');
    }
    
    // 3. images table
    const { error: imagesError } = await supabase.rpc('create_images_table_if_not_exists');
    if (imagesError) {
      console.error('Error creating images table:', imagesError);
    } else {
      console.log('Images table created or already exists');
    }
    
    // 4. tests table
    const { error: testsError } = await supabase.rpc('create_tests_table_if_not_exists');
    if (testsError) {
      console.error('Error creating tests table:', testsError);
    } else {
      console.log('Tests table created or already exists');
    }
    
    // 5. test_comments table
    const { error: testCommentsError } = await supabase.rpc('create_test_comments_table_if_not_exists');
    if (testCommentsError) {
      console.error('Error creating test_comments table:', testCommentsError);
    } else {
      console.log('Test comments table created or already exists');
    }
    
    // 6. game_scores table
    const { error: gameScoresError } = await supabase.rpc('create_game_scores_table_if_not_exists');
    if (gameScoresError) {
      console.error('Error creating game_scores table:', gameScoresError);
    } else {
      console.log('Game scores table created or already exists');
    }
    
    // 7. user_activities table
    const { error: userActivitiesError } = await supabase.rpc('create_user_activities_table_if_not_exists');
    if (userActivitiesError) {
      console.error('Error creating user_activities table:', userActivitiesError);
    } else {
      console.log('User activities table created or already exists');
    }
    
    console.log('Table creation process completed');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// SQL sorguları ile tabloları oluştur
async function createTablesWithSQL() {
  try {
    console.log('Creating tables in Supabase with SQL...');
    
    // Users tablosu
    const { error: usersError } = await supabase.from('users').select('count').limit(1);
    if (usersError && usersError.code === '42P01') { // Table doesn't exist
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            uuid TEXT NOT NULL,
            username TEXT NOT NULL,
            password TEXT,
            email TEXT,
            score INTEGER DEFAULT 0,
            avatar TEXT,
            role TEXT DEFAULT 'user',
            banned BOOLEAN DEFAULT false,
            last_login_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      });
      if (error) {
        console.error('Error creating users table:', error);
      } else {
        console.log('Users table created');
      }
    } else {
      console.log('Users table already exists');
    }
    
    // Categories tablosu
    const { error: categoriesError } = await supabase.from('categories').select('count').limit(1);
    if (categoriesError && categoriesError.code === '42P01') {
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            icon_url TEXT,
            icon_name TEXT,
            color TEXT,
            background_color TEXT,
            "order" INTEGER DEFAULT 0,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      });
      if (error) {
        console.error('Error creating categories table:', error);
      } else {
        console.log('Categories table created');
      }
    } else {
      console.log('Categories table already exists');
    }
    
    // Images tablosu
    const { error: imagesError } = await supabase.from('images').select('count').limit(1);
    if (imagesError && imagesError.code === '42P01') {
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS images (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            image_url TEXT NOT NULL,
            storage_key TEXT,
            category_id INTEGER REFERENCES categories(id),
            answers TEXT[] NOT NULL,
            hints TEXT[],
            difficulty INTEGER DEFAULT 1,
            play_count INTEGER DEFAULT 0,
            like_count INTEGER DEFAULT 0,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            created_by INTEGER,
            updated_at TIMESTAMP WITH TIME ZONE
          );
        `
      });
      if (error) {
        console.error('Error creating images table:', error);
      } else {
        console.log('Images table created');
      }
    } else {
      console.log('Images table already exists');
    }
    
    // Tests tablosu
    const { error: testsError } = await supabase.from('tests').select('count').limit(1);
    if (testsError && testsError.code === '42P01') {
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS tests (
            id SERIAL PRIMARY KEY,
            uuid TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            creator_id INTEGER,
            category_id INTEGER REFERENCES categories(id),
            image_ids INTEGER[],
            play_count INTEGER DEFAULT 0,
            like_count INTEGER DEFAULT 0,
            is_public BOOLEAN DEFAULT false,
            approved BOOLEAN DEFAULT false,
            featured BOOLEAN DEFAULT false,
            difficulty INTEGER DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE,
            thumbnail TEXT,
            settings JSONB
          );
        `
      });
      if (error) {
        console.error('Error creating tests table:', error);
      } else {
        console.log('Tests table created');
      }
    } else {
      console.log('Tests table already exists');
    }
    
    // Test Comments tablosu
    const { error: testCommentsError } = await supabase.from('test_comments').select('count').limit(1);
    if (testCommentsError && testCommentsError.code === '42P01') {
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS test_comments (
            id SERIAL PRIMARY KEY,
            test_id INTEGER REFERENCES tests(id),
            user_id INTEGER REFERENCES users(id),
            comment TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      });
      if (error) {
        console.error('Error creating test_comments table:', error);
      } else {
        console.log('Test comments table created');
      }
    } else {
      console.log('Test comments table already exists');
    }
    
    // Game Scores tablosu
    const { error: gameScoresError } = await supabase.from('game_scores').select('count').limit(1);
    if (gameScoresError && gameScoresError.code === '42P01') {
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS game_scores (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            score INTEGER NOT NULL,
            game_mode TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      });
      if (error) {
        console.error('Error creating game_scores table:', error);
      } else {
        console.log('Game scores table created');
      }
    } else {
      console.log('Game scores table already exists');
    }
    
    // User Activities tablosu
    const { error: userActivitiesError } = await supabase.from('user_activities').select('count').limit(1);
    if (userActivitiesError && userActivitiesError.code === '42P01') {
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS user_activities (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            user_name TEXT,
            activity_type TEXT NOT NULL,
            details TEXT,
            entity_id INTEGER,
            entity_type TEXT,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `
      });
      if (error) {
        console.error('Error creating user_activities table:', error);
      } else {
        console.log('User activities table created');
      }
    } else {
      console.log('User activities table already exists');
    }
    
    console.log('Table creation process with SQL completed');
  } catch (error) {
    console.error('Error in createTablesWithSQL:', error);
  }
}

// Ana fonksiyon
async function main() {
  try {
    // İlk olarak SQL ile tabloları oluşturmayı dene
    await createTablesWithSQL();
    
    console.log('All tables have been created successfully.');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Script'i çalıştır
main();