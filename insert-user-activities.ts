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

async function createUserActivities() {
  console.log('Creating user activities...');
  
  try {
    // Check if activities already exist
    const { count } = await client`SELECT COUNT(*) as count FROM user_activities`;
    
    if (parseInt(count) > 0) {
      console.log('✅ User activities already exist, skipping');
      return;
    }
    
    // Get admin user ID
    const users = await client`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
    const adminId = users.length > 0 ? users[0].id : null;
    
    if (!adminId) {
      console.error('❌ Admin user not found');
      return;
    }
    
    // Create sample activities for admin
    await client`
      INSERT INTO user_activities (user_id, user_name, activity_type, details, entity_id, entity_type, created_at)
      VALUES 
        (${adminId}, 'admin', 'login', 'Kullanıcı giriş yaptı', NULL, NULL, NOW() - INTERVAL '3 days'),
        (${adminId}, 'admin', 'create_category', 'Yeni kategori oluşturuldu: Arabalar', 1, 'category', NOW() - INTERVAL '3 days 1 hour'),
        (${adminId}, 'admin', 'create_image', 'Yeni görsel eklendi: Ferrari 458', 1, 'image', NOW() - INTERVAL '3 days 2 hours'),
        (${adminId}, 'admin', 'create_category', 'Yeni kategori oluşturuldu: Coğrafya', 2, 'category', NOW() - INTERVAL '2 days'),
        (${adminId}, 'admin', 'create_image', 'Yeni görsel eklendi: İstanbul Boğazı', 2, 'image', NOW() - INTERVAL '2 days 1 hour'),
        (${adminId}, 'admin', 'create_category', 'Yeni kategori oluşturuldu: Film & TV', 3, 'category', NOW() - INTERVAL '1 day'),
        (${adminId}, 'admin', 'create_image', 'Yeni görsel eklendi: Star Wars', 3, 'image', NOW() - INTERVAL '1 day 1 hour'),
        (${adminId}, 'admin', 'create_test', 'Yeni test oluşturuldu: Arabalar Testi', 1, 'test', NOW() - INTERVAL '12 hours'),
        (${adminId}, 'admin', 'create_test', 'Yeni test oluşturuldu: Film Karakterleri', 2, 'test', NOW() - INTERVAL '6 hours'),
        (${adminId}, 'admin', 'play_test', 'Test oynandı: Arabalar Testi', 1, 'test', NOW() - INTERVAL '5 hours'),
        (${adminId}, 'admin', 'like_test', 'Teste beğeni verildi: Arabalar Testi', 1, 'test', NOW() - INTERVAL '4 hours'),
        (${adminId}, 'admin', 'play_test', 'Test oynandı: Film Karakterleri', 2, 'test', NOW() - INTERVAL '3 hours'),
        (${adminId}, 'admin', 'like_test', 'Teste beğeni verildi: Film Karakterleri', 2, 'test', NOW() - INTERVAL '2 hours'),
        (${adminId}, 'admin', 'comment_test', 'Teste yorum yapıldı: Film Karakterleri - "Harika bir test!"', 2, 'test', NOW() - INTERVAL '1 hour'),
        (${adminId}, 'admin', 'login', 'Kullanıcı giriş yaptı', NULL, NULL, NOW() - INTERVAL '30 minutes')
    `;
    
    console.log('✅ User activities created successfully');
  } catch (error) {
    console.error('❌ Error creating user activities:', error);
  } finally {
    await client.end();
  }
}

createUserActivities();