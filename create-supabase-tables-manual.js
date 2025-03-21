import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to run SQL query using pg_client directly
async function runSql(query) {
  try {
    // PostgreSQL connection string
    const connectionString = process.env.DATABASE_URL;
    
    // Create a PostgreSQL client and connect
    const { Pool } = pg;
    const pool = new Pool({
      connectionString,
    });
    
    // Run the query
    const result = await pool.query(query);
    await pool.end();
    
    return { result, error: null };
  } catch (error) {
    console.error('Error executing query:', error);
    return { result: null, error };
  }
}

// Main function to create tables
async function createTables() {
  try {
    console.log('Creating tables in Supabase...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'supabase-tables-create-only.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    // Execute each statement
    for (const stmt of statements) {
      const { error } = await runSql(stmt);
      
      if (error) {
        console.error(`Error executing SQL statement: ${stmt.substring(0, 50)}...`, error);
      } else {
        console.log(`Successfully executed: ${stmt.substring(0, 50)}...`);
      }
    }
    
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// Run the main function
createTables().then(() => {
  console.log('Process completed');
}).catch(err => {
  console.error('Error:', err);
});