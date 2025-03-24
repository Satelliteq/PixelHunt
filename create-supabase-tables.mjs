import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase bağlantısı
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL veya SUPABASE_KEY bulunamadı!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTablesWithSQL() {
  try {
    // SQL dosyasını oku
    const sqlFilePath = path.join(__dirname, 'create-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // SQL içeriğini satırlara böl ve her bir SQL ifadesini çalıştır
    const sqlStatements = sqlContent.split(';').filter(stmt => stmt.trim() !== '');
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i].trim() + ';';
      if (statement.length > 1) {
        console.log(`SQL ifadesi ${i+1} çalıştırılıyor...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.error(`SQL ifadesi ${i+1} çalıştırılırken hata:`, error);
        }
      }
    }

    console.log('Tüm tablolar ve örnek veriler başarıyla oluşturuldu!');
  } catch (error) {
    console.error('Tablolar oluşturulurken hata:', error);
  }
}

// Tabloları oluştur ve örnek verileri ekle
createTablesWithSQL();