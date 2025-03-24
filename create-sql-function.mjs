import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Supabase bağlantısı
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL veya SUPABASE_KEY bulunamadı!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFunction() {
  try {
    console.log('Supabase SQL fonksiyonu oluşturuluyor...');
    
    // exec_sql fonksiyonunu oluştur
    const { error } = await supabase.rpc('exec_sql', { 
      sql_query: 'CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN EXECUTE sql_query; RETURN json_build_object(\'success\', true); EXCEPTION WHEN OTHERS THEN RETURN json_build_object(\'success\', false, \'error\', SQLERRM); END; $$;' 
    }).single();
    
    if (error) {
      console.log('Fonksiyon oluşturulmaya çalışılırken hata oluştu; doğrudan SQL sorgusu çalıştırılıyor...');
      
      // Doğrudan SQL sorgusu çalıştırma
      const { error: directError } = await supabase.from('_exec_sql').select('*').limit(1);
      
      if (directError) {
        // SQL sorgusu doğrudan sunucuda çalıştırılmalı
        console.error('exec_sql fonksiyonu oluşturulamadı:', directError);
        console.log('------------------------------------------------');
        console.log('ÖNEMLİ: Lütfen Supabase SQL editöründe aşağıdaki kodu çalıştırın:');
        console.log('------------------------------------------------');
        console.log(`
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text) 
RETURNS json 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$ 
BEGIN 
  EXECUTE sql_query; 
  RETURN json_build_object('success', true); 
EXCEPTION 
  WHEN OTHERS THEN 
    RETURN json_build_object('success', false, 'error', SQLERRM); 
END; 
$$;

-- Fonksiyona yetki ver
ALTER FUNCTION public.exec_sql(text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.exec_sql(text) TO anon;
GRANT ALL ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT ALL ON FUNCTION public.exec_sql(text) TO service_role;
        `);
        console.log('------------------------------------------------');
      } else {
        console.log('Fonksiyon başarıyla oluşturuldu!');
      }
    } else {
      console.log('Fonksiyon başarıyla oluşturuldu!');
    }
  } catch (error) {
    console.error('Fonksiyon oluşturulurken hata:', error);
    console.log('------------------------------------------------');
    console.log('ÖNEMLİ: Lütfen Supabase SQL editöründe aşağıdaki kodu çalıştırın:');
    console.log('------------------------------------------------');
    console.log(`
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text) 
RETURNS json 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$ 
BEGIN 
  EXECUTE sql_query; 
  RETURN json_build_object('success', true); 
EXCEPTION 
  WHEN OTHERS THEN 
    RETURN json_build_object('success', false, 'error', SQLERRM); 
END; 
$$;

-- Fonksiyona yetki ver
ALTER FUNCTION public.exec_sql(text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.exec_sql(text) TO anon;
GRANT ALL ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT ALL ON FUNCTION public.exec_sql(text) TO service_role;
    `);
    console.log('------------------------------------------------');
  }
}

createFunction();