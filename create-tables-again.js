import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    // Drop all tables first to ensure clean slate
    const tableQueries = [
      `
      DROP TABLE IF EXISTS game_scores;
      DROP TABLE IF EXISTS test_comments; 
      DROP TABLE IF EXISTS tests;
      DROP TABLE IF EXISTS images;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS user_activities;
      DROP TABLE IF EXISTS users;
      `,
      `
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
      `,
      `
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
      `,
      `
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
      `,
      `
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
      `,
      `
      CREATE TABLE IF NOT EXISTS test_comments (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS game_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        game_mode VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL,
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      `,
      `
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
      `
    ];

    for (const query of tableQueries) {
      const { error } = await supabase.rpc('exec_sql', { query });
      if (error) {
        console.error('Error executing table creation query:', error);
      } else {
        console.log('Query executed successfully');
      }
    }

    console.log('All tables created successfully');

    // Create RLS policies and enable row level security
    const rlsQueries = [
      `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE categories ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE images ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE tests ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE test_comments ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;`,
      
      // Create policies for public access
      `CREATE POLICY "Public read access" ON users FOR SELECT USING (true);`,
      `CREATE POLICY "Public read access" ON categories FOR SELECT USING (active = true);`,
      `CREATE POLICY "Public read access" ON images FOR SELECT USING (active = true);`,
      `CREATE POLICY "Public read access" ON tests FOR SELECT USING (is_public = true AND approved = true);`,
      `CREATE POLICY "Public read access" ON test_comments FOR SELECT USING (true);`,
      `CREATE POLICY "Public read access" ON game_scores FOR SELECT USING (true);`,
      
      // Create policies for authenticated users
      `CREATE POLICY "Auth users can create" ON tests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);`,
      `CREATE POLICY "Auth users can update own tests" ON tests FOR UPDATE USING (creator_id = auth.uid());`,
      `CREATE POLICY "Auth users can add comments" ON test_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);`,
      `CREATE POLICY "Auth users can add scores" ON game_scores FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);`,
    ];

    for (const query of rlsQueries) {
      const { error } = await supabase.rpc('exec_sql', { query });
      if (error) {
        console.error('Error executing RLS query:', error);
      } else {
        console.log('RLS query executed successfully');
      }
    }

    console.log('All RLS policies created successfully');

  } catch (error) {
    console.error('Error in createTables:', error);
  }
}

// Add sample data
async function addSampleData() {
  try {
    // Add sample categories
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
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select();
      
      if (error) {
        console.error('Error adding category:', error);
      } else {
        console.log('Category added:', data);
      }
    }
    
    console.log('Sample categories added');

    // Add sample tests
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .limit(5);
    
    if (categoryData && categoryData.length > 0) {
      const tests = [
        {
          uuid: 'f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454',
          title: 'Sanat Tarihi Testi',
          description: 'Ünlü eserleri ve sanatçıları ne kadar iyi tanıyorsunuz?',
          category_id: categoryData[0].id,
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
          uuid: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
          title: 'Araba Logoları Testi',
          description: 'Araba markalarını logolarından tanıyabilecek misiniz?',
          category_id: categoryData[1].id,
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
          uuid: 'q1w2e3r4-t5y6-u7i8-o9p0-a1s2d3f4g5h6',
          title: 'Film Karakterleri Testi',
          description: 'Ünlü film karakterlerini tanıyabilecek misiniz?',
          category_id: categoryData[2].id,
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
          console.error('Error adding test:', error);
        } else {
          console.log('Test added:', data);
        }
      }
      
      console.log('Sample tests added');
    }
  } catch (error) {
    console.error('Error in addSampleData:', error);
  }
}

async function main() {
  try {
    // Create stored procedure for executing arbitrary SQL
    const { error: procError } = await supabase.rpc('exec_sql', { 
      query: `
        CREATE OR REPLACE FUNCTION exec_sql(query text) RETURNS void AS $$
        BEGIN
          EXECUTE query;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (procError) {
      // If the stored procedure already exists, it will fail, but we can still use it
      console.log('Creating exec_sql procedure failed (may already exist):', procError);
    } else {
      console.log('Created exec_sql procedure');
    }

    await createTables();
    await addSampleData();
    console.log('Database setup completed');
  } catch (error) {
    console.error('Error in main:', error);
  }
}

main();