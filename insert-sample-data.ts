import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema';
import { createClient } from '@supabase/supabase-js';

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

// Supabase Bağlantısı
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      persistSession: false
    }
  }
);

async function getUserIdByUuid(uuid: string): Promise<number | null> {
  const result = await db.select({ id: schema.users.id })
    .from(schema.users)
    .where(schema.users.uuid.equals(uuid))
    .limit(1);
  
  return result.length > 0 ? result[0].id : null;
}

async function addSampleUsers() {
  console.log('Adding sample users...');
  
  try {
    // Check if users already exist
    const existingUsers = await db.select().from(schema.users);
    
    if (existingUsers.length === 0) {
      // Sample users
      await db.insert(schema.users).values([
        {
          uuid: '5d946ebe-c6b0-4488-801a-f4b1e67138bb', // This should match the Supabase Auth user
          username: 'admin',
          password: 'hashed_password_here',
          email: 'admin@example.com',
          role: 'admin',
          score: 1000,
          avatar: 'https://ui-avatars.com/api/?name=Admin&background=random',
          banned: false,
          lastLoginAt: new Date(),
          createdAt: new Date()
        },
        {
          uuid: '7a8b9c0d-1e2f-3g4h-5i6j-7k8l9m0n1o2p',
          username: 'test_user',
          password: 'hashed_password_here',
          email: 'user@example.com',
          role: 'user',
          score: 500,
          avatar: 'https://ui-avatars.com/api/?name=Test+User&background=random',
          banned: false,
          lastLoginAt: new Date(),
          createdAt: new Date()
        }
      ]);
      
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
    const existingCategories = await db.select().from(schema.categories);
    
    if (existingCategories.length < 5) {
      // Sample categories
      await db.insert(schema.categories).values([
        {
          name: 'Arabalar',
          description: 'Otomobil markaları ve modelleri',
          iconName: 'car',
          color: '#EF4444', // Red-500
          backgroundColor: '#FEF2F2', // Red-50
          order: 1,
          active: true,
          createdAt: new Date()
        },
        {
          name: 'Coğrafya',
          description: 'Dünya üzerindeki yerler ve landmark\'lar',
          iconName: 'globe',
          color: '#3B82F6', // Blue-500
          backgroundColor: '#EFF6FF', // Blue-50
          order: 2,
          active: true,
          createdAt: new Date()
        },
        {
          name: 'Film & TV',
          description: 'Filmler, TV şovları ve karakterler',
          iconName: 'film',
          color: '#8B5CF6', // Violet-500
          backgroundColor: '#F5F3FF', // Violet-50
          order: 3,
          active: true,
          createdAt: new Date()
        },
        {
          name: 'Sanat',
          description: 'Ünlü sanat eserleri ve sanatçılar',
          iconName: 'palette',
          color: '#EC4899', // Pink-500
          backgroundColor: '#FDF2F8', // Pink-50
          order: 4,
          active: true,
          createdAt: new Date()
        },
        {
          name: 'Oyunlar',
          description: 'Video oyunları ve karakterleri',
          iconName: 'gamepad',
          color: '#10B981', // Emerald-500
          backgroundColor: '#ECFDF5', // Emerald-50
          order: 5,
          active: true,
          createdAt: new Date()
        }
      ]);
      
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
    const existingImages = await db.select().from(schema.images);
    
    if (existingImages.length < 5) {
      // Sample images
      await db.insert(schema.images).values([
        {
          title: 'Ferrari 458',
          imageUrl: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
          categoryId: 1, // Arabalar
          answers: JSON.stringify(['Ferrari', 'Ferrari 458', '458 Italia']),
          difficulty: 2,
          playCount: 120,
          likeCount: 45,
          active: true,
          createdAt: new Date()
        },
        {
          title: 'İstanbul Boğazı',
          imageUrl: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
          categoryId: 2, // Coğrafya
          answers: JSON.stringify(['İstanbul', 'Istanbul', 'Boğaz', 'Bogazici', 'Bosphorus']),
          difficulty: 1,
          playCount: 200,
          likeCount: 78,
          active: true,
          createdAt: new Date()
        },
        {
          title: 'Star Wars - Darth Vader',
          imageUrl: 'https://images.unsplash.com/photo-1608889175638-9322300c87e8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
          categoryId: 3, // Film & TV
          answers: JSON.stringify(['Star Wars', 'Darth Vader', 'Vader']),
          difficulty: 2,
          playCount: 180,
          likeCount: 95,
          active: true,
          createdAt: new Date()
        },
        {
          title: 'Mona Lisa',
          imageUrl: 'https://images.unsplash.com/photo-1423742774270-6884aac775fa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
          categoryId: 4, // Sanat
          answers: JSON.stringify(['Mona Lisa', 'Leonardo da Vinci', 'da Vinci']),
          difficulty: 1,
          playCount: 150,
          likeCount: 67,
          active: true,
          createdAt: new Date()
        },
        {
          title: 'Minecraft',
          imageUrl: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80',
          categoryId: 5, // Oyunlar
          answers: JSON.stringify(['Minecraft', 'Mine Craft']),
          difficulty: 1,
          playCount: 250,
          likeCount: 120,
          active: true,
          createdAt: new Date()
        }
      ]);
      
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
    const existingTests = await db.select().from(schema.tests);
    
    if (existingTests.length < 3) {
      // Get admin user ID
      const adminId = await getUserIdByUuid('5d946ebe-c6b0-4488-801a-f4b1e67138bb');
      
      if (!adminId) {
        console.error('❌ Admin user not found');
        return;
      }
      
      // Sample tests
      await db.insert(schema.tests).values([
        {
          title: 'Arabalar Testi',
          description: 'Otomobil markaları ve modelleri hakkında bilginizi test edin',
          creatorId: adminId,
          categoryId: 1, // Arabalar
          imageIds: JSON.stringify([1]), // Ferrari 458
          difficulty: 2,
          playCount: 50,
          likeCount: 20,
          isPublic: true,
          approved: true,
          featured: true,
          thumbnail: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
          createdAt: new Date(),
          settings: JSON.stringify({ timeLimit: 30, revealSpeed: 'normal' })
        },
        {
          title: 'Film Karakterleri',
          description: 'Popüler film karakterlerini ne kadar iyi tanıyorsunuz?',
          creatorId: adminId,
          categoryId: 3, // Film & TV
          imageIds: JSON.stringify([3]), // Star Wars
          difficulty: 2,
          playCount: 75,
          likeCount: 35,
          isPublic: true,
          approved: true,
          featured: true,
          thumbnail: 'https://images.unsplash.com/photo-1608889175638-9322300c87e8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
          createdAt: new Date(),
          settings: JSON.stringify({ timeLimit: 30, revealSpeed: 'normal' })
        },
        {
          title: 'Sanat Eserleri',
          description: 'Ünlü sanat eserleri ve sanatçılar hakkında bilginizi test edin',
          creatorId: adminId,
          categoryId: 4, // Sanat
          imageIds: JSON.stringify([4]), // Mona Lisa
          difficulty: 1,
          playCount: 40,
          likeCount: 15,
          isPublic: true,
          approved: true,
          featured: false,
          thumbnail: 'https://images.unsplash.com/photo-1423742774270-6884aac775fa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
          createdAt: new Date(),
          settings: JSON.stringify({ timeLimit: 30, revealSpeed: 'normal' })
        }
      ]);
      
      console.log('✅ Sample tests added');
    } else {
      console.log('✅ Tests already exist, skipping');
    }
  } catch (error) {
    console.error('❌ Error adding sample tests:', error);
  }
}

async function addSampleActivities() {
  console.log('Adding sample user activities...');
  
  try {
    // Check if activities already exist
    const existingActivities = await db.select().from(schema.userActivities);
    
    if (existingActivities.length < 10) {
      // Get user IDs
      const adminId = await getUserIdByUuid('5d946ebe-c6b0-4488-801a-f4b1e67138bb');
      const userId = adminId; // Using admin as the user for simplicity
      
      if (!adminId) {
        console.error('❌ Admin user not found');
        return;
      }
      
      // Sample activities
      await db.insert(schema.userActivities).values([
        {
          userId: adminId,
          userName: 'admin',
          activityType: 'login',
          details: 'Kullanıcı giriş yaptı',
          createdAt: new Date(Date.now() - 10 * 60000) // 10 minutes ago
        },
        {
          userId: adminId,
          userName: 'admin',
          activityType: 'create_category',
          details: 'Yeni kategori oluşturuldu: Arabalar',
          entityId: 1,
          entityType: 'category',
          createdAt: new Date(Date.now() - 9 * 60000) // 9 minutes ago
        },
        {
          userId: adminId,
          userName: 'admin',
          activityType: 'create_image',
          details: 'Yeni görsel eklendi: Ferrari 458',
          entityId: 1,
          entityType: 'image',
          createdAt: new Date(Date.now() - 8 * 60000) // 8 minutes ago
        },
        {
          userId: adminId,
          userName: 'admin',
          activityType: 'create_test',
          details: 'Yeni test oluşturuldu: Arabalar Testi',
          entityId: 1,
          entityType: 'test',
          createdAt: new Date(Date.now() - 7 * 60000) // 7 minutes ago
        },
        {
          userId: adminId,
          userName: 'admin',
          activityType: 'play_test',
          details: 'Test oynandı: Arabalar Testi',
          entityId: 1,
          entityType: 'test',
          metadata: JSON.stringify({ score: 50, completionTime: 25 }),
          createdAt: new Date(Date.now() - 6 * 60000) // 6 minutes ago
        },
        {
          userId: adminId,
          userName: 'admin',
          activityType: 'like_test',
          details: 'Teste beğeni verildi: Arabalar Testi',
          entityId: 1,
          entityType: 'test',
          createdAt: new Date(Date.now() - 5 * 60000) // 5 minutes ago
        },
        {
          userId: adminId,
          userName: 'admin',
          activityType: 'create_test',
          details: 'Yeni test oluşturuldu: Film Karakterleri',
          entityId: 2,
          entityType: 'test',
          createdAt: new Date(Date.now() - 4 * 60000) // 4 minutes ago
        },
        {
          userId: adminId,
          userName: 'admin',
          activityType: 'play_test',
          details: 'Test oynandı: Film Karakterleri',
          entityId: 2,
          entityType: 'test',
          metadata: JSON.stringify({ score: 75, completionTime: 20 }),
          createdAt: new Date(Date.now() - 3 * 60000) // 3 minutes ago
        },
        {
          userId: adminId,
          userName: 'admin',
          activityType: 'comment_test',
          details: 'Teste yorum yapıldı: Film Karakterleri - "Harika bir test!"',
          entityId: 2,
          entityType: 'test',
          createdAt: new Date(Date.now() - 2 * 60000) // 2 minutes ago
        },
        {
          userId: adminId,
          userName: 'admin',
          activityType: 'feature_test',
          details: 'Test öne çıkarıldı: Film Karakterleri',
          entityId: 2,
          entityType: 'test',
          createdAt: new Date(Date.now() - 1 * 60000) // 1 minute ago
        }
      ]);
      
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
    await addSampleActivities();
    
    console.log('✅ All sample data added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  } finally {
    await client.end();
  }
}

main();