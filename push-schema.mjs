import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Veritabanı bağlantısı oluştur
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL ortam değişkeni bulunamadı");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(sql);

async function pushSchema() {
  try {
    console.log("Şema değişikliklerini SQL'e dönüştürüyor...");
    
    // drizzle-kit komutunu çalıştır, ancak interactive mod olmadan
    exec("npx drizzle-kit push:pg", (error, stdout, stderr) => {
      if (error) {
        console.error(`Hata oluştu: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
      }
      
      console.log(`stdout: ${stdout}`);
      console.log("Şema başarıyla güncellendi!");
    });
  } catch (error) {
    console.error("Şema güncellenirken hata:", error);
  }
}

await pushSchema();