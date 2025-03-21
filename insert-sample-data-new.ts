import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm/expressions';
import * as schema from './shared/schema';

// PostgreSQL client'ı
const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const client = postgres(connectionString, {
  ssl: { rejectUnauthorized: false }
});

// Mevcut tablo yapılarına göre sorgu yapmak için basit fonksiyonlar
async function addSampleUsers() {
  console.log('Adding sample users...');
  
  try {
    // Check if users already exist
    const { count } = await client`SELECT COUNT(*) as count FROM users`;
    
    if (parseInt(count) === 0) {
      await client`
        INSERT INTO users (username, password, score, avatar, role, banned, created_at)
        VALUES 
          ('admin', 'hashed_password', 1000, 'https://ui-avatars.com/api/?name=Admin&background=random', 'admin', false, NOW()),
          ('test_user', 'hashed_password', 500, 'https://ui-avatars.com/api/?name=Test+User&background=random', 'user', false, NOW())
      `;
      
      console.log('✅ Sample users added');
    } else {
      console.log('✅ Users already exist, skipping');
    }
  } catch (error) {
    console.error('❌ Error adding sample users:', error);
  }
}

async function addSampleCategories() {
  console.log('Adding sample categories...');
  
  try {
    await client`
      INSERT INTO categories (name, description, icon_url, icon_name, color)
      VALUES 
        ('Arabalar', 'Otomobil markaları ve modelleri', null, 'car', '#FF5722'),
        ('Coğrafya', 'Dünya üzerindeki yerler ve landmarklar', null, 'globe', '#4CAF50'),
        ('Film & TV', 'Filmler, TV şovları ve karakterler', null, 'film', '#2196F3'),
        ('Sanat', 'Ünlü sanat eserleri ve sanatçılar', null, 'palette', '#9C27B0'),
        ('Oyunlar', 'Video oyunları ve karakterleri', null, 'gamepad', '#FFC107')
      ON CONFLICT (name) DO NOTHING
    `;
    
    console.log('✅ Sample categories added');
  } catch (error) {
    console.error('❌ Error adding sample categories:', error);
  }
}

async function addSampleImages() {
  console.log('Adding sample images...');
  
  try {
    await client`
      INSERT INTO images (title, image_url, category_id, answers, difficulty, play_count, like_count, active, created_at)
      VALUES 
        ('Ferrari 458', 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500', 
          (SELECT id FROM categories WHERE name = 'Arabalar' LIMIT 1), 
          ${JSON.stringify(["Ferrari", "Ferrari 458", "458 Italia"])}, 2, 120, 45, true, NOW()),
        ('İstanbul Boğazı', 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=500', 
          (SELECT id FROM categories WHERE name = 'Coğrafya' LIMIT 1), 
          ${JSON.stringify(["İstanbul", "Istanbul", "Boğaz", "Bogazici", "Bosphorus"])}, 1, 200, 78, true, NOW()),
        ('Star Wars - Darth Vader', 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=500', 
          (SELECT id FROM categories WHERE name = 'Film & TV' LIMIT 1), 
          ${JSON.stringify(["Star Wars", "Darth Vader", "Vader"])}, 2, 180, 95, true, NOW()),
        ('Mona Lisa', 'https://images.unsplash.com/photo-1423742774270-6884aac775fa?w=500', 
          (SELECT id FROM categories WHERE name = 'Sanat' LIMIT 1), 
          ${JSON.stringify(["Mona Lisa", "Leonardo da Vinci", "da Vinci"])}, 1, 150, 67, true, NOW()),
        ('Minecraft', 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=500', 
          (SELECT id FROM categories WHERE name = 'Oyunlar' LIMIT 1), 
          ${JSON.stringify(["Minecraft", "Mine Craft"])}, 1, 250, 120, true, NOW())
    `;
    
    console.log('✅ Sample images added');
  } catch (error) {
    console.error('❌ Error adding sample images:', error);
  }
}

async function addSampleTests() {
  console.log('Adding sample tests...');
  
  try {
    await client`
      INSERT INTO tests (uuid, title, description, creator_id, category_id, image_ids, difficulty, play_count, like_count, is_public, approved, featured, thumbnail, created_at)
      VALUES 
        (gen_random_uuid(), 'Arabalar Testi', 'Otomobil markaları ve modelleri hakkında bilginizi test edin', 
          (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 
          (SELECT id FROM categories WHERE name = 'Arabalar' LIMIT 1), 
          ${JSON.stringify([1])}, 2, 50, 20, true, true, true, 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500', NOW()),
        (gen_random_uuid(), 'Film Karakterleri', 'Popüler film karakterlerini ne kadar iyi tanıyorsunuz?', 
          (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 
          (SELECT id FROM categories WHERE name = 'Film & TV' LIMIT 1), 
          ${JSON.stringify([3])}, 2, 75, 35, true, true, true, 'https://images.unsplash.com/photo-1608889175638-9322300c87e8?w=500', NOW()),
        (gen_random_uuid(), 'Sanat Eserleri', 'Ünlü sanat eserleri ve sanatçılar hakkında bilginizi test edin', 
          (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 
          (SELECT id FROM categories WHERE name = 'Sanat' LIMIT 1), 
          ${JSON.stringify([4])}, 1, 40, 15, true, true, true, 'https://images.unsplash.com/photo-1423742774270-6884aac775fa?w=500', NOW())
    `;
    
    console.log('✅ Sample tests added');
  } catch (error) {
    console.error('❌ Error adding sample tests:', error);
  }
}

async function addSampleUserActivities() {
  console.log('Adding sample user activities...');
  
  try {
    // Ensuring we have some activities, but only if they don't exist
    const activityCount = await client`SELECT COUNT(*) as count FROM user_activities`;
    
    if (parseInt(activityCount.count) === 0) {
      await client`
        INSERT INTO user_activities (user_id, user_name, activity_type, details, entity_id, entity_type, created_at)
        VALUES 
          (1, 'admin', 'login', 'Kullanıcı giriş yaptı', NULL, NULL, NOW() - INTERVAL '10 minutes'),
          (1, 'admin', 'create_category', 'Yeni kategori oluşturuldu: Arabalar', 1, 'category', NOW() - INTERVAL '9 minutes'),
          (1, 'admin', 'create_image', 'Yeni görsel eklendi: Ferrari 458', 1, 'image', NOW() - INTERVAL '8 minutes'),
          (1, 'admin', 'create_test', 'Yeni test oluşturuldu: Arabalar Testi', 1, 'test', NOW() - INTERVAL '7 minutes'),
          (1, 'admin', 'play_test', 'Test oynandı: Arabalar Testi', 1, 'test', NOW() - INTERVAL '6 minutes'),
          (1, 'admin', 'like_test', 'Teste beğeni verildi: Arabalar Testi', 1, 'test', NOW() - INTERVAL '5 minutes')
      `;
      
      console.log('✅ Sample user activities added');
    } else {
      console.log('✅ User activities already exist, skipping');
    }
  } catch (error) {
    console.error('❌ Error adding sample user activities:', error);
  }
}

async function main() {
  try {
    // Add sample data
    await addSampleUsers();
    await addSampleCategories();
    await addSampleImages();
    await addSampleTests();
    await addSampleUserActivities();
    
    console.log('✅ All sample data added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  } finally {
    await client.end();
  }
}

main();