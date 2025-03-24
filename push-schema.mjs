// Push schema script
// Alternatif olarak interaktif olmayan bir şekilde schema değişikliklerini veritabanına uygular

import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL bağlantısı
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL çevre değişkeni bulunamadı.");
  process.exit(1);
}

async function pushSchema() {
  console.log("Şema değişiklikleri veritabanına uygulanıyor...");
  
  try {
    // Bağlantı kurma
    const sql = postgres(connectionString, { max: 1 });
    
    // image_url alanını kategori tablosuna ekle (yoksa)
    await sql`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE categories ADD COLUMN image_url TEXT;
          EXCEPTION WHEN duplicate_column THEN 
          RAISE NOTICE 'image_url column already exists in categories table';
        END;
      END $$;
    `;
    
    // order alanını sil eğer varsa (kullanılmıyor)
    await sql`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE categories DROP COLUMN IF EXISTS "order";
          RAISE NOTICE 'order column dropped from categories table if it existed';
        END;
      END $$;
    `;
    
    // updated_at alanını ekle (yoksa)
    await sql`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP;
          EXCEPTION WHEN duplicate_column THEN 
          RAISE NOTICE 'updated_at column already exists in categories table';
        END;
      END $$;
    `;
    
    console.log("Şema başarıyla güncellendi!");
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error("Şema güncellenirken hata oluştu:", error);
    process.exit(1);
  }
}

pushSchema();