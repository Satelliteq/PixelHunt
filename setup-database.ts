import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Read environment variables
const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

// Create postgres client
const queryClient = postgres(connectionString);

async function main() {
  try {
    console.log('Starting database setup...');
    
    // Read the SQL files
    const createTablesSQL = fs.readFileSync(path.join(__dirname, 'create-tables.sql'), 'utf8');
    const insertSampleDataSQL = fs.readFileSync(path.join(__dirname, 'insert-sample-data.sql'), 'utf8');
    
    // Execute create tables SQL
    console.log('Creating tables...');
    await queryClient.unsafe(createTablesSQL);
    console.log('Tables created successfully');
    
    // Execute insert sample data SQL
    console.log('Inserting sample data...');
    await queryClient.unsafe(insertSampleDataSQL);
    console.log('Sample data inserted successfully');
    
    console.log('Database setup completed');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    // Close the connection
    await queryClient.end();
  }
}

main().catch(console.error);