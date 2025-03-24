// Push schema script
// Alternatif olarak interaktif olmayan bir şekilde schema değişikliklerini veritabanına uygular

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import dotenv from "dotenv";
import * as schema from "./shared/schema.js";

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
    
    // Şemayı uygula (CREATE TABLE, ALTER TABLE vb.)
    await migrate(db, { migrationsFolder: "./migrations" });
    
    console.log("Şema başarıyla güncellendi!");
    process.exit(0);
  } catch (error) {
    console.error("Şema güncellenirken hata oluştu:", error);
    process.exit(1);
  }
}

pushSchema();