import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// PostgreSQL client
const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const client = postgres(connectionString, {
  ssl: { rejectUnauthorized: false }
});

async function addSampleImages() {
  console.log('Adding sample images...');
  
  try {
    // Verify we have categories first
    const categories = await client`SELECT * FROM categories`;
    console.log(`Found ${categories.length} categories`);
    
    if (categories.length === 0) {
      console.log('❌ No categories found, please add categories first');
      return;
    }
    
    // Get existing images count
    const { count } = await client`SELECT COUNT(*) as count FROM images`;
    console.log(`Current image count: ${count}`);
    
    if (parseInt(count) === 0) {
      // Add each image separately to troubleshoot any issues
      
      console.log('Adding Ferrari 458 image...');
      await client`
        INSERT INTO images (
          title, 
          image_url, 
          category_id, 
          answers, 
          difficulty, 
          play_count, 
          like_count, 
          active, 
          created_at
        ) VALUES (
          'Ferrari 458', 
          'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500', 
          ${categories[0].id}, 
          ${JSON.stringify(["Ferrari", "Ferrari 458", "458 Italia"])}, 
          2, 
          120, 
          45, 
          true, 
          NOW()
        )
      `;
      
      console.log('Adding İstanbul Boğazı image...');
      await client`
        INSERT INTO images (
          title, 
          image_url, 
          category_id, 
          answers, 
          difficulty, 
          play_count, 
          like_count, 
          active, 
          created_at
        ) VALUES (
          'İstanbul Boğazı', 
          'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=500', 
          ${categories[0].id}, 
          ${JSON.stringify(["İstanbul", "Istanbul", "Boğaz", "Bogazici", "Bosphorus"])}, 
          1, 
          200, 
          78, 
          true, 
          NOW()
        )
      `;
      
      console.log('Adding Star Wars image...');
      await client`
        INSERT INTO images (
          title, 
          image_url, 
          category_id, 
          answers, 
          difficulty, 
          play_count, 
          like_count, 
          active, 
          created_at
        ) VALUES (
          'Star Wars - Darth Vader', 
          'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=500', 
          ${categories[0].id}, 
          ${JSON.stringify(["Star Wars", "Darth Vader", "Vader"])}, 
          2, 
          180, 
          95, 
          true, 
          NOW()
        )
      `;
      
      console.log('Adding Mona Lisa image...');
      await client`
        INSERT INTO images (
          title, 
          image_url, 
          category_id, 
          answers, 
          difficulty, 
          play_count, 
          like_count, 
          active, 
          created_at
        ) VALUES (
          'Mona Lisa', 
          'https://images.unsplash.com/photo-1423742774270-6884aac775fa?w=500', 
          ${categories[0].id}, 
          ${JSON.stringify(["Mona Lisa", "Leonardo da Vinci", "da Vinci"])}, 
          1, 
          150, 
          67, 
          true, 
          NOW()
        )
      `;
      
      console.log('Adding Minecraft image...');
      await client`
        INSERT INTO images (
          title, 
          image_url, 
          category_id, 
          answers, 
          difficulty, 
          play_count, 
          like_count, 
          active, 
          created_at
        ) VALUES (
          'Minecraft', 
          'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=500', 
          ${categories[0].id}, 
          ${JSON.stringify(["Minecraft", "Mine Craft"])}, 
          1, 
          250, 
          120, 
          true, 
          NOW()
        )
      `;
      
      console.log('✅ Sample images added successfully');
    } else {
      console.log('✅ Images already exist, skipping');
    }
  } catch (error) {
    console.error('❌ Error adding sample images:', error);
  }
}

async function main() {
  try {
    await addSampleImages();
    console.log('✅ All sample data added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  } finally {
    await client.end();
  }
}

main();