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
    // Check if categories already exist
    const { count } = await client`SELECT COUNT(*) as count FROM categories`;
    
    if (parseInt(count) === 0) {
      await client`
        INSERT INTO categories (name, description, icon_url)
        VALUES 
          ('Arabalar', 'Otomobil markaları ve modelleri', 'car'),
          ('Coğrafya', 'Dünya üzerindeki yerler ve landmarklar', 'globe'),
          ('Film & TV', 'Filmler, TV şovları ve karakterler', 'film'),
          ('Sanat', 'Ünlü sanat eserleri ve sanatçılar', 'palette'),
          ('Oyunlar', 'Video oyunları ve karakterleri', 'gamepad')
      `;
      
      console.log('✅ Sample categories added');
    } else {
      console.log('✅ Categories already exist, skipping');
    }
  } catch (error) {
    console.error('❌ Error adding sample categories:', error);
  }
}

async function addSampleImages() {
  console.log('Adding sample images...');
  
  try {
    // Check if images already exist
    const { count } = await client`SELECT COUNT(*) as count FROM images`;
    
    if (parseInt(count) === 0) {
      await client`
        INSERT INTO images (title, category_id, answers, difficulty, play_count, like_count, created_at)
        VALUES 
          ('Ferrari 458', 1, ${'["Ferrari", "Ferrari 458", "458 Italia"]'}, 2, 120, 45, NOW()),
          ('İstanbul Boğazı', 2, ${'["İstanbul", "Istanbul", "Boğaz", "Bogazici", "Bosphorus"]'}, 1, 200, 78, NOW()),
          ('Star Wars - Darth Vader', 3, ${'["Star Wars", "Darth Vader", "Vader"]'}, 2, 180, 95, NOW()),
          ('Mona Lisa', 4, ${'["Mona Lisa", "Leonardo da Vinci", "da Vinci"]'}, 1, 150, 67, NOW()),
          ('Minecraft', 5, ${'["Minecraft", "Mine Craft"]'}, 1, 250, 120, NOW())
      `;
      
      console.log('✅ Sample images added');
    } else {
      console.log('✅ Images already exist, skipping');
    }
  } catch (error) {
    console.error('❌ Error adding sample images:', error);
  }
}

async function addSampleTests() {
  console.log('Adding sample tests...');
  
  try {
    // Check if tests already exist
    const { count } = await client`SELECT COUNT(*) as count FROM tests`;
    
    if (parseInt(count) === 0) {
      // Get admin user ID
      const users = await client`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
      const adminId = users.length > 0 ? users[0].id : null;
      
      if (!adminId) {
        console.warn('⚠️ Admin user not found, using null for creator_id');
      }
      
      await client`
        INSERT INTO tests (title, description, creator_id, category_id, image_ids, difficulty, play_count, like_count, is_public, approved, published, thumbnail, created_at)
        VALUES 
          ('Arabalar Testi', 'Otomobil markaları ve modelleri hakkında bilginizi test edin', ${adminId}, 1, ${'[1]'}, 2, 50, 20, true, true, true, 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500', NOW()),
          ('Film Karakterleri', 'Popüler film karakterlerini ne kadar iyi tanıyorsunuz?', ${adminId}, 3, ${'[3]'}, 2, 75, 35, true, true, true, 'https://images.unsplash.com/photo-1608889175638-9322300c87e8?w=500', NOW()),
          ('Sanat Eserleri', 'Ünlü sanat eserleri ve sanatçılar hakkında bilginizi test edin', ${adminId}, 4, ${'[4]'}, 1, 40, 15, true, true, true, 'https://images.unsplash.com/photo-1423742774270-6884aac775fa?w=500', NOW())
      `;
      
      console.log('✅ Sample tests added');
    } else {
      console.log('✅ Tests already exist, skipping');
    }
  } catch (error) {
    console.error('❌ Error adding sample tests:', error);
  }
}

async function addSampleUserActivities() {
  console.log('Adding sample user activities...');
  
  try {
    // Check if activities already exist
    const { count } = await client`SELECT COUNT(*) as count FROM user_activities`;
    
    if (parseInt(count) === 0) {
      // Get admin user ID
      const users = await client`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
      const adminId = users.length > 0 ? users[0].id : null;
      
      if (!adminId) {
        console.warn('⚠️ Admin user not found, skipping activities');
        return;
      }
      
      // Example activities
      await client`
        INSERT INTO user_activities (user_id, user_name, activity_type, details, entity_id, entity_type, created_at)
        VALUES 
          (${adminId}, 'admin', 'login', 'Kullanıcı giriş yaptı', NULL, NULL, NOW() - INTERVAL '10 minutes'),
          (${adminId}, 'admin', 'create_category', 'Yeni kategori oluşturuldu: Arabalar', 1, 'category', NOW() - INTERVAL '9 minutes'),
          (${adminId}, 'admin', 'create_image', 'Yeni görsel eklendi: Ferrari 458', 1, 'image', NOW() - INTERVAL '8 minutes'),
          (${adminId}, 'admin', 'create_test', 'Yeni test oluşturuldu: Arabalar Testi', 1, 'test', NOW() - INTERVAL '7 minutes'),
          (${adminId}, 'admin', 'play_test', 'Test oynandı: Arabalar Testi', 1, 'test', NOW() - INTERVAL '6 minutes'),
          (${adminId}, 'admin', 'like_test', 'Teste beğeni verildi: Arabalar Testi', 1, 'test', NOW() - INTERVAL '5 minutes'),
          (${adminId}, 'admin', 'create_test', 'Yeni test oluşturuldu: Film Karakterleri', 2, 'test', NOW() - INTERVAL '4 minutes'),
          (${adminId}, 'admin', 'play_test', 'Test oynandı: Film Karakterleri', 2, 'test', NOW() - INTERVAL '3 minutes')
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