import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase bağlantısı
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSQLFunctions() {
  try {
    console.log('Creating SQL functions in Supabase...');
    
    // SQL dosyasını oku
    const sqlFilePath = path.join(__dirname, 'create-supabase-functions.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // SQL içeriğini fonksiyonlara böl
    const functionDefinitions = sqlContent.split('-- ').filter(sql => sql.trim().length > 0);
    
    // Her fonksiyonu çalıştır
    for (const functionDef of functionDefinitions) {
      try {
        const { error } = await supabase.rpc('execute_sql', {
          sql_query: functionDef
        });
        
        if (error) {
          // Eğer execute_sql fonksiyonu yoksa, doğrudan SQL çalıştır
          if (error.message.includes('function "execute_sql" does not exist')) {
            // İlk execute_sql fonksiyonunu oluşturmaya çalış
            if (functionDef.includes('execute_sql')) {
              const { error: directError } = await supabase.rpc('pg_query', {
                sql_query: functionDef
              });
              
              if (directError) {
                // Son çare: SQL query doğrudan Supabase REST API üzerinden çalıştır
                const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/pg_query`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': process.env.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
                  },
                  body: JSON.stringify({ sql_query: functionDef })
                });
                
                if (!response.ok) {
                  console.error('Error executing SQL via REST API:', await response.text());
                } else {
                  console.log('Created function via REST API');
                }
              } else {
                console.log('Created execute_sql function');
              }
            }
          } else {
            console.error('Error executing SQL function:', error);
          }
        } else {
          console.log('Successfully executed SQL function');
        }
      } catch (err) {
        console.error('Error processing function definition:', err);
      }
    }
    
    console.log('SQL functions creation process completed');
  } catch (error) {
    console.error('Error creating SQL functions:', error);
  }
}

// Tabloları oluşturmak için SQL çalıştır
async function createTablesWithQuery() {
  try {
    console.log('Creating tables with direct SQL...');
    
    // SQL dosyasını oku
    const sqlContent = fs.readFileSync(path.join(__dirname, 'create-supabase-tables.sql'), 'utf8');
    
    // SQL sorgusunu çalıştır
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      console.error('Error executing table creation SQL:', error);
    } else {
      console.log('Tables created successfully with SQL');
    }
    
  } catch (error) {
    console.error('Error in createTablesWithQuery:', error);
  }
}

// Ana fonksiyon
async function main() {
  try {
    // Create SQL fonksiyonlarını oluştur
    await createSQLFunctions();
    
    console.log('All SQL functions have been created successfully.');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Script'i çalıştır
main();