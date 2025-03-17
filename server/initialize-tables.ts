import { supabase } from './supabase-setup';

/**
 * This utility function tries to create tables using Supabase JavaScript client
 * Can be run directly to initialize all required tables
 */
export async function initializeSupabaseTables() {
  try {
    console.log('Initializing Supabase tables...');
    
    // Check if categories table exists
    const { data: categoriesTest, error: categoriesTestError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (categoriesTestError && categoriesTestError.code === '42P01') {
      console.log('Creating categories table...');
      
      // Create categories table
      const { error: createCategoriesError } = await supabase.rpc('create_categories_table', {});
      
      if (createCategoriesError) {
        console.error('Error creating categories table with RPC:', createCategoriesError);
        
        // Try direct query if RPC fails
        const { error: directError } = await supabase.from('_postgrest_temp').select('*');
        if (directError) {
          console.error('Cannot create tables. Please use Supabase SQL Editor to create tables.');
        }
      } else {
        console.log('Categories table created successfully');
      }
    } else {
      console.log('Categories table already exists');
    }
    
    // Insert sample categories
    console.log('Adding sample categories...');
    const categories = [
      { 
        name: 'Otomobiller', 
        description: 'Araçlar ve otomobillerle ilgili testler', 
        icon_url: 'https://api.iconify.design/mdi:car.svg' 
      },
      { 
        name: 'Coğrafya', 
        description: 'Haritalar, şehirler ve coğrafi konuları içeren testler', 
        icon_url: 'https://api.iconify.design/mdi:earth.svg' 
      },
      { 
        name: 'Film ve TV', 
        description: 'Filmler, diziler ve TV programları hakkında testler', 
        icon_url: 'https://api.iconify.design/mdi:movie.svg' 
      },
      { 
        name: 'Sanat', 
        description: 'Tüm sanat dalları ve ilgili testler', 
        icon_url: 'https://api.iconify.design/mdi:palette.svg' 
      }
    ];
    
    // Insert each category individually to avoid unique constraint issues
    for (const category of categories) {
      const { error: insertError } = await supabase
        .from('categories')
        .insert(category)
        .select('id')
        .single();
        
      if (insertError && insertError.code !== '23505') {
        // Ignore duplicate key errors (23505)
        console.error(`Error inserting category "${category.name}":`, insertError);
      } else {
        console.log(`Category "${category.name}" added or already exists`);
      }
    }
    
    console.log('Supabase table initialization complete');
    return true;
  } catch (error) {
    console.error('Error initializing Supabase tables:', error);
    return false;
  }
}

// Auto-run when this file is imported
initializeSupabaseTables().then(() => {
  console.log('Table initialization process completed');
});