// Push schema script
// Alternatif olarak interaktif olmayan bir şekilde schema değişikliklerini veritabanına uygular

import { drizzle } from 'drizzle-orm/postgres-js';
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
    const db = drizzle(sql, { schema });
    
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
    
    console.log("Şema başarıyla güncellendi!");
    process.exit(0);
  } catch (error) {
    console.error("Şema güncellenirken hata oluştu:", error);
    process.exit(1);
  }
}

pushSchema();