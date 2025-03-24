import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  }
});

// Doğrudan SQL sorguları ile tabloları oluştur
async function createTablesWithSQL() {
  try {
    // SQL fonksiyonunu oluştur (varsa sil ve tekrar oluştur)
    await supabase.rpc('exec_sql', { 
      query: `
        DROP FUNCTION IF EXISTS exec_sql(text);
        CREATE OR REPLACE FUNCTION exec_sql(query text) RETURNS void AS $$
        BEGIN
          EXECUTE query;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    }).catch(err => {
      console.log('Stored procedure creation may have failed (could already exist):', err);
    });
    
    // Sırayla SQL komutlarını çalıştır
    const queries = [
      // Varsa tabloları sil
      `
      DROP TABLE IF EXISTS game_scores CASCADE;
      DROP TABLE IF EXISTS test_comments CASCADE;
      DROP TABLE IF EXISTS tests CASCADE;
      DROP TABLE IF EXISTS images CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS user_activities CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      `,
      
      // Kullanıcılar tablosu
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
      
      // Kategoriler tablosu
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
      
      // Görüntüler tablosu
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
      
      // Testler tablosu
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
      
      // Test yorumları tablosu
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
      
      // Oyun puanları tablosu
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
      
      // Kullanıcı aktiviteleri tablosu
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
      `,
      
      // RLS Politikaları
      `
      -- Row Level Security etkinleştir
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE images ENABLE ROW LEVEL SECURITY;
      ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
      ALTER TABLE test_comments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
      
      -- Public erişim politikaları
      CREATE POLICY "Public read access for users" ON users FOR SELECT USING (true);
      CREATE POLICY "Public read access for categories" ON categories FOR SELECT USING (active = true);
      CREATE POLICY "Public read access for images" ON images FOR SELECT USING (active = true);
      CREATE POLICY "Public read access for tests" ON tests FOR SELECT USING (is_public = true AND approved = true);
      CREATE POLICY "Public read access for test_comments" ON test_comments FOR SELECT USING (true);
      CREATE POLICY "Public read access for game_scores" ON game_scores FOR SELECT USING (true);
      
      -- Admin (service_role) tam erişim
      CREATE POLICY "Full access for service_role" ON users FOR ALL USING (true);
      CREATE POLICY "Full access for service_role" ON categories FOR ALL USING (true);
      CREATE POLICY "Full access for service_role" ON images FOR ALL USING (true);
      CREATE POLICY "Full access for service_role" ON tests FOR ALL USING (true);
      CREATE POLICY "Full access for service_role" ON test_comments FOR ALL USING (true);
      CREATE POLICY "Full access for service_role" ON game_scores FOR ALL USING (true);
      CREATE POLICY "Full access for service_role" ON user_activities FOR ALL USING (true);
      `
    ];
    
    // Her sorguyu çalıştır
    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { query });
      if (error) {
        console.error('Error executing query:', error);
      } else {
        console.log('Query executed successfully!');
      }
    }
    
    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables with SQL:', error);
  }
}

// Örnek veri ekleme
async function addSampleData() {
  try {
    // Örnek admin kullanıcısı ekle
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        username: 'admin',
        email: 'admin@pixelhunt.com',
        password_hash: '$2a$10$rk8vVQDnDxP15oQs03Kqn.ZdLzjS9/0NyeWFRfgvikN4vGJl6VvJu', // 'password123'
        role: 'admin'
      })
      .select();
      
    if (userError) {
      console.error('Error adding user:', userError);
    } else {
      console.log('Admin user added:', userData[0].id);
      
      // Örnek kategoriler ekle
      const categories = [
        {
          name: 'Sanat',
          description: 'Resim, heykel ve diğer görsel sanatlar',
          icon_name: 'palette',
          color: '#EC4899',
          background_color: '#FCE7F3'
        },
        {
          name: 'Arabalar',
          description: 'Otomobil markaları ve modelleri',
          icon_name: 'car',
          color: '#EF4444',
          background_color: '#FEF2F2'
        },
        {
          name: 'Filmler',
          description: 'Film afişleri ve sahneleri',
          icon_name: 'film',
          color: '#6366F1',
          background_color: '#EEF2FF'
        },
        {
          name: 'Bilim',
          description: 'Bilimsel içerikler ve buluşlar',
          icon_name: 'flask',
          color: '#0EA5E9',
          background_color: '#E0F2FE'
        },
        {
          name: 'Coğrafya',
          description: 'Ülkeler, şehirler ve haritalar',
          icon_name: 'globe',
          color: '#10B981',
          background_color: '#ECFDF5'
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
          console.log('Category added:', data[0].id, data[0].name);
        }
      }
      
      // Kategori ID'lerini al
      const { data: categoryData, error: catError } = await supabase
        .from('categories')
        .select('id, name')
        .order('id');
        
      if (catError) {
        console.error('Error fetching categories:', catError);
      } else {
        console.log('Categories fetched:', categoryData.length);
        
        // Örnek test verileri ekle
        if (categoryData.length >= 3) {
          const tests = [
            {
              uuid: 'f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454',
              title: 'Sanat Tarihi Testi',
              description: 'Ünlü eserleri ve sanatçıları ne kadar iyi tanıyorsunuz?',
              category_id: categoryData[0].id,
              creator_id: userData[0].id,
              difficulty: 2,
              image_url: 'https://images.unsplash.com/photo-1594026112902-70bf4bfc79d5?w=500',
              questions: [
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
              ],
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
              creator_id: userData[0].id,
              difficulty: 1,
              image_url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=500',
              questions: [
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
              ],
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
              creator_id: userData[0].id,
              difficulty: 3,
              image_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500',
              questions: [
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
              ],
              play_count: 89,
              like_count: 41,
              approved: true,
              is_public: true,
              featured: true
            }
          ];
          
          for (const test of tests) {
            // JSONB ile doğru şekilde eklenmesi için
            const testData = {
              ...test,
              questions: JSON.stringify(test.questions)
            };
            
            const { data, error } = await supabase
              .from('tests')
              .insert(testData)
              .select();
              
            if (error) {
              console.error('Error adding test:', error);
            } else {
              console.log('Test added:', data[0].id, data[0].title);
            }
          }
          
          // Örnek resimler ekle
          const images = [
            {
              title: 'Mona Lisa',
              image_url: 'https://images.unsplash.com/photo-1594026112902-70bf4bfc79d5',
              category_id: categoryData[0].id,
              answers: ['Mona Lisa', 'La Gioconda'],
              difficulty: 2,
              play_count: 125,
              like_count: 78,
              created_by: userData[0].id
            },
            {
              title: 'BMW Logosu',
              image_url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888',
              category_id: categoryData[1].id,
              answers: ['BMW', 'Bayerische Motoren Werke'],
              difficulty: 1,
              play_count: 88,
              like_count: 45,
              created_by: userData[0].id
            },
            {
              title: 'Star Wars',
              image_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728',
              category_id: categoryData[2].id,
              answers: ['Star Wars', 'Yıldız Savaşları'],
              difficulty: 3,
              play_count: 145,
              like_count: 92,
              created_by: userData[0].id
            }
          ];
          
          for (const image of images) {
            const { data, error } = await supabase
              .from('images')
              .insert(image)
              .select();
              
            if (error) {
              console.error('Error adding image:', error);
            } else {
              console.log('Image added:', data[0].id, data[0].title);
            }
          }
        } else {
          console.error('Not enough categories found!');
        }
      }
    }
  } catch (error) {
    console.error('Error adding sample data:', error);
  }
}

// Ana işlev
async function main() {
  try {
    console.log('Creating tables...');
    await createTablesWithSQL();
    
    console.log('Adding sample data...');
    await addSampleData();
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error in main:', error);
  }
}

main();