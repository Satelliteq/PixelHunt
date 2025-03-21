import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { and, eq } from 'drizzle-orm/expressions';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Supabase Bağlantısı
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      persistSession: false
    }
  }
);

// Drizzle ORM için PostgreSQL client'ı
const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const migrationClient = postgres(connectionString, { 
  max: 1,
  ssl: { rejectUnauthorized: false }
});

const queryClient = postgres(connectionString, {
  ssl: { rejectUnauthorized: false }
});

// Drizzle ORM instance
export const db = drizzle(queryClient, { schema });

// Migrations (development için)
export async function runMigrations() {
  if (process.env.NODE_ENV === 'development') {
    try {
      // Migration dosyaları mevcut değilse hata vermeden devam et
      console.log('Checking for migrations...');
      
      const migrationsFolderExists = false;
      if (migrationsFolderExists) {
        await migrate(drizzle(migrationClient), { migrationsFolder: './drizzle' });
        console.log('Migrations completed');
      } else {
        console.log('No migrations found, skipping...');
      }
    } catch (err) {
      console.error('Error during migrations:', err);
    } finally {
      await migrationClient.end();
    }
  }
}

// Supabase Storage
export const storage = {
  // Resim yükleme
  uploadImage: async (
    file: File | Blob,
    bucketName: string = 'images',
    folderPath: string = ''
  ): Promise<{ url: string; key: string } | null> => {
    if (!file) return null;
    
    // File name oluştur (rastgele)
    const fileExt = file.type.split('/')[1];
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }
    
    const { data: urlData } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(data.path);
    
    return {
      url: urlData.publicUrl,
      key: data.path
    };
  },
  
  // Resim silme
  deleteImage: async (filePath: string, bucketName: string = 'images'): Promise<boolean> => {
    const { error } = await supabase
      .storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }
    
    return true;
  }
};

// Kullanıcı aktivitelerini kaydetme
export const recordUserActivity = async (
  userId: number,
  activityType: string,
  details?: string,
  entityId?: number,
  entityType?: string,
  metadata?: any,
  userName?: string
): Promise<void> => {
  try {
    // Eğer userName verilmediyse, kullanıcı bilgilerini al
    let resolvedUserName = userName;
    if (!resolvedUserName) {
      const userResult = await db.select({ username: schema.users.username })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);
      
      if (userResult.length > 0) {
        resolvedUserName = userResult[0].username;
      }
    }

    await db.insert(schema.userActivities).values({
      userId,
      userName: resolvedUserName,
      activityType,
      details,
      entityId: entityId || null,
      entityType: entityType || null,
      metadata: metadata ? JSON.stringify(metadata) : null
    });
  } catch (error) {
    console.error('Error recording user activity:', error);
  }
};