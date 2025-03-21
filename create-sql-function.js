import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createFunction() {
  try {
    console.log('Creating record_user_activity function...');
    
    // PostgreSQL connection string
    const connectionString = process.env.DATABASE_URL;
    
    // Create a PostgreSQL client and connect
    const { Pool } = pg;
    const pool = new Pool({
      connectionString,
    });
    
    // Function definition
    const functionSql = `
    CREATE OR REPLACE FUNCTION record_user_activity(
        p_user_id INTEGER,
        p_user_name TEXT,
        p_activity_type TEXT,
        p_details TEXT DEFAULT NULL,
        p_entity_id INTEGER DEFAULT NULL,
        p_entity_type TEXT DEFAULT NULL,
        p_metadata JSONB DEFAULT NULL
    )
    RETURNS VOID
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $BODY$
    BEGIN
        INSERT INTO user_activities (
            user_id, user_name, activity_type, details, entity_id, entity_type, metadata
        ) VALUES (
            p_user_id, p_user_name, p_activity_type, p_details, p_entity_id, p_entity_type, p_metadata
        );
    END;
    $BODY$;
    `;
    
    // Run the query
    const result = await pool.query(functionSql);
    console.log('Function created successfully');
    
    await pool.end();
  } catch (error) {
    console.error('Error creating function:', error);
  }
}

// Run the main function
createFunction().then(() => {
  console.log('Process completed');
}).catch(err => {
  console.error('Error:', err);
});