import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are not defined');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBuckets() {
  console.log('Creating storage buckets in Supabase...');
  
  try {
    // Create 'images' bucket
    console.log('Creating images bucket...');
    const { data: imagesBucket, error: imagesError } = await supabase.storage.createBucket(
      'images',
      {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      }
    );
    
    if (imagesError) {
      // Check if it's already exists error
      if (imagesError.message.includes('already exists')) {
        console.log('Images bucket already exists');
      } else {
        throw imagesError;
      }
    } else {
      console.log('Images bucket created successfully');
    }
    
    // Create 'profile-images' bucket
    console.log('Creating profile-images bucket...');
    const { data: profileBucket, error: profileError } = await supabase.storage.createBucket(
      'profile-images',
      {
        public: true,
        fileSizeLimit: 2097152, // 2MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      }
    );
    
    if (profileError) {
      // Check if it's already exists error
      if (profileError.message.includes('already exists')) {
        console.log('Profile-images bucket already exists');
      } else {
        throw profileError;
      }
    } else {
      console.log('Profile-images bucket created successfully');
    }
    
    // Create 'test-assets' bucket
    console.log('Creating test-assets bucket...');
    const { data: testBucket, error: testError } = await supabase.storage.createBucket(
      'test-assets',
      {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      }
    );
    
    if (testError) {
      // Check if it's already exists error
      if (testError.message.includes('already exists')) {
        console.log('Test-assets bucket already exists');
      } else {
        throw testError;
      }
    } else {
      console.log('Test-assets bucket created successfully');
    }
    
    console.log('✅ All storage buckets created or already exist in Supabase!');
  } catch (error) {
    console.error('❌ Error creating storage buckets:', error);
  }
}

createBuckets();