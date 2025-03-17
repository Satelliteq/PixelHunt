import { supabase } from './supabase-setup';
import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

// Veritabanı bağlantı havuzu
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Bu modül, PostgreSQL tabloları ile Supabase arasındaki senkronizasyonu sağlar
 * Tablolar zaten varsa, bu tabloların Supabase tarafından da görünür olmasını sağlar
 */

export async function syncTablesWithSupabase() {
  console.log('PostgreSQL tabloları Supabase ile senkronize ediliyor...');
  
  try {
    // Önce public şemasındaki mevcut tabloları kontrol edelim
    const tableCheckResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    const existingTables = tableCheckResult.rows.map(row => row.table_name);
    console.log('Mevcut tablolar:', existingTables);
    
    if (existingTables.length === 0) {
      console.log('Hiç tablo bulunamadı, senkronizasyona gerek yok');
      return false;
    }
    
    // Önce mevcut rollerini kontrol edelim
    try {
      const rolesResult = await pool.query(`
        SELECT rolname FROM pg_roles WHERE rolname IN ('postgres', 'anon', 'authenticated', 'service_role');
      `);
      
      const existingRoles = rolesResult.rows.map(row => row.rolname);
      console.log('Mevcut roller:', existingRoles);
      
      // Eksik roller var mı
      const missingRoles = ['anon', 'authenticated', 'service_role'].filter(
        role => !existingRoles.includes(role)
      );
      
      if (missingRoles.length > 0) {
        console.log('Eksik roller tespit edildi:', missingRoles);
        
        // Gerekli rolleri oluştur
        for (const role of missingRoles) {
          try {
            await pool.query(`
              CREATE ROLE ${role};
            `);
            console.log(`${role} rolü oluşturuldu`);
          } catch (roleError) {
            console.error(`${role} rolü oluşturma hatası:`, roleError);
          }
        }
      }
      
      // Roller varsa izinleri ayarlayalım
      const roles = existingRoles.concat(missingRoles.filter(role => role !== 'postgres'));
      
      if (roles.length > 0) {
        const rolesStr = roles.join(', ');
        
        await pool.query(`
          -- İzinlerin ayarlanması
          GRANT USAGE ON SCHEMA public TO ${rolesStr};
          ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${rolesStr};
          ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${rolesStr};
          ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${rolesStr};
        `);
        console.log('Schema izinleri ayarlandı');
      }
    } catch (roleCheckError) {
      console.error('Rol kontrolü hatası:', roleCheckError);
    }
    
    // Mevcut tabloların izinlerini ayarlayalım
    for (const tableName of existingTables) {
      try {
        // Her tablo için public şeması izinleri - postgres rolünü atlayalım
        await pool.query(`
          GRANT ALL PRIVILEGES ON TABLE public.${tableName} TO anon, authenticated, service_role;
        `);
        console.log(`${tableName} tablosu için izinler ayarlandı`);
      } catch (tableError) {
        console.error(`${tableName} tablosu için izin hatası:`, tableError);
      }
    }
    
    // Fonksiyonları da kontrol edelim ve izinleri ayarlayalım
    const functionCheckResult = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
    `);
    
    const existingFunctions = functionCheckResult.rows.map(row => row.routine_name);
    console.log('Mevcut fonksiyonlar:', existingFunctions);
    
    // RLS (Row Level Security) politikalarını devre dışı bırakalım (geliştirme aşamasında)
    for (const tableName of existingTables) {
      try {
        await pool.query(`
          ALTER TABLE public.${tableName} DISABLE ROW LEVEL SECURITY;
        `);
        console.log(`${tableName} tablosu için RLS devre dışı bırakıldı`);
      } catch (rlsError) {
        console.error(`${tableName} tablosu için RLS hatası:`, rlsError);
      }
    }
    
    // Supabase'in tabloları tanıması için metadata güncelleme işlemi
    try {
      await pool.query(`
        -- Supabase schema refresh
        NOTIFY pgrst, 'reload schema';
      `);
      console.log('Supabase schema yenileme sinyali gönderildi');
    } catch (notifyError) {
      console.error('Schema yenileme hatası:', notifyError);
    }
    
    console.log('PostgreSQL tabloları başarıyla Supabase ile senkronize edildi');
    return true;
  } catch (error) {
    console.error('Supabase senkronizasyon hatası:', error);
    return false;
  } finally {
    // Bağlantı havuzunu kapatmayı unutmayalım
    await pool.end();
  }
}

// ES modules için doğrudan çalıştırma kontrolü
if (import.meta.url === (typeof document === 'undefined' ? new URL(process.argv[1], 'file:').href : undefined)) {
  syncTablesWithSupabase().then(success => {
    if (success) {
      console.log('Supabase senkronizasyonu başarıyla tamamlandı');
      process.exit(0);
    } else {
      console.error('Supabase senkronizasyonu başarısız oldu');
      process.exit(1);
    }
  }).catch(err => {
    console.error('Beklenmeyen hata:', err);
    process.exit(1);
  });
}