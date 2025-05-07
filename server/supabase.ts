import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env variables
dotenv.config();

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is not defined in .env file');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in .env file');
}

// Supabase Bağlantısı
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Hata yakalama için ayrı bir hata işleme mekanizması kullanın
// Supabase istemcisi bir event emitter değil, bu nedenle .on() kullanılamaz

// Drizzle ORM'den kalan db nesnesini kaldırıyoruz, 
// artık bunu kullanmak yerine doğrudan supabase nesnesini kullanıyoruz
export const db = supabase;

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
    if (!resolvedUserName && userId) {
      const { data: userData, error } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .limit(1)
        .single();
      
      if (!error && userData) {
        resolvedUserName = userData.username;
      }
    }
    
    const { error } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        user_name: resolvedUserName,
        activity_type: activityType,
        details,
        entity_id: entityId || null,
        entity_type: entityType || null,
        metadata: metadata ? JSON.stringify(metadata) : null
      });
      
    if (error) {
      console.error('Error inserting user activity:', error);
    }
  } catch (error) {
    console.error('Error recording user activity:', error);
  }
};