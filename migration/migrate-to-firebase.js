const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'pixelhunt-7afa8.appspot.com'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Migration stats
const stats = {
  users: { total: 0, migrated: 0, errors: 0 },
  categories: { total: 0, migrated: 0, errors: 0 },
  images: { total: 0, migrated: 0, errors: 0 },
  tests: { total: 0, migrated: 0, errors: 0 },
  testComments: { total: 0, migrated: 0, errors: 0 },
  gameScores: { total: 0, migrated: 0, errors: 0 },
  userActivities: { total: 0, migrated: 0, errors: 0 },
  files: { total: 0, migrated: 0, errors: 0 }
};

// Helper function to download and upload files to Firebase Storage
async function migrateFile(url, destination) {
  try {
    if (!url || !url.startsWith('http')) {
      return null;
    }
    
    stats.files.total++;
    
    // Download file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    const tempFilePath = path.join(__dirname, 'temp_' + Date.now());
    fs.writeFileSync(tempFilePath, buffer);
    
    // Upload to Firebase Storage
    const uploadResponse = await bucket.upload(tempFilePath, {
      destination: destination,
      metadata: {
        contentType: response.headers.get('content-type'),
        cacheControl: 'public, max-age=31536000'
      }
    });
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    
    // Get public URL
    const file = uploadResponse[0];
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    
    stats.files.migrated++;
    return publicUrl;
  } catch (error) {
    console.error(`Error migrating file ${url}:`, error);
    stats.files.errors++;
    return url; // Return original URL on error
  }
}

// Migrate users
async function migrateUsers() {
  console.log('Migrating users...');
  
  try {
    // Get users from Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    stats.users.total = users.length;
    
    // Create a batch for Firebase
    const batch = db.batch();
    
    // Process each user
    for (const user of users) {
      try {
        const userRef = db.collection('users').doc(user.id.toString());
        
        // Migrate avatar if exists
        let avatarUrl = user.avatar;
        if (avatarUrl && avatarUrl.startsWith('http')) {
          const newAvatarUrl = await migrateFile(
            avatarUrl, 
            `user-avatars/${user.id}/${path.basename(avatarUrl)}`
          );
          if (newAvatarUrl) avatarUrl = newAvatarUrl;
        }
        
        // Map user data to Firebase structure
        const userData = {
          uid: user.uuid || admin.firestore.FieldValue.serverTimestamp(),
          username: user.username,
          email: user.email || '',
          role: user.role || 'user',
          score: user.score || 0,
          avatarUrl: avatarUrl || null,
          banned: user.banned || false,
          lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : null,
          createdAt: user.created_at ? new Date(user.created_at) : admin.firestore.FieldValue.serverTimestamp()
        };
        
        batch.set(userRef, userData);
        stats.users.migrated++;
      } catch (err) {
        console.error(`Error processing user ${user.id}:`, err);
        stats.users.errors++;
      }
    }
    
    // Commit the batch
    await batch.commit();
    console.log(`Migrated ${stats.users.migrated} of ${stats.users.total} users`);
  } catch (error) {
    console.error('Error migrating users:', error);
  }
}

// Migrate categories
async function migrateCategories() {
  console.log('Migrating categories...');
  
  try {
    // Get categories from Supabase
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*');
    
    if (error) throw error;
    stats.categories.total = categories.length;
    
    // Create a batch for Firebase
    const batch = db.batch();
    
    // Process each category
    for (const category of categories) {
      try {
        const categoryRef = db.collection('categories').doc(category.id.toString());
        
        // Map category data to Firebase structure
        const categoryData = {
          name: category.name,
          description: category.description || '',
          iconName: category.iconname || null,
          color: category.color || '#4F46E5',
          backgroundColor: category.backgroundcolor || null,
          active: category.active !== false,
          createdAt: category.created_at ? new Date(category.created_at) : admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: category.updated_at ? new Date(category.updated_at) : null
        };
        
        batch.set(categoryRef, categoryData);
        stats.categories.migrated++;
      } catch (err) {
        console.error(`Error processing category ${category.id}:`, err);
        stats.categories.errors++;
      }
    }
    
    // Commit the batch
    await batch.commit();
    console.log(`Migrated ${stats.categories.migrated} of ${stats.categories.total} categories`);
  } catch (error) {
    console.error('Error migrating categories:', error);
  }
}

// Migrate images
async function migrateImages() {
  console.log('Migrating images...');
  
  try {
    // Get images from Supabase
    const { data: images, error } = await supabase
      .from('images')
      .select('*');
    
    if (error) throw error;
    stats.images.total = images.length;
    
    // Process each image (not in batch due to file uploads)
    for (const image of images) {
      try {
        const imageRef = db.collection('images').doc(image.id.toString());
        
        // Migrate image file if exists
        let imageUrl = image.image_url;
        if (imageUrl && imageUrl.startsWith('http')) {
          const newImageUrl = await migrateFile(
            imageUrl, 
            `images/${image.id}/${path.basename(imageUrl)}`
          );
          if (newImageUrl) imageUrl = newImageUrl;
        }
        
        // Parse answers and hints
        let answers = [];
        let hints = [];
        
        try {
          if (typeof image.answers === 'string') {
            answers = JSON.parse(image.answers);
          } else if (Array.isArray(image.answers)) {
            answers = image.answers;
          }
        } catch (e) {
          console.warn(`Could not parse answers for image ${image.id}:`, e);
        }
        
        try {
          if (image.hints && typeof image.hints === 'string') {
            hints = JSON.parse(image.hints);
          } else if (Array.isArray(image.hints)) {
            hints = image.hints;
          }
        } catch (e) {
          console.warn(`Could not parse hints for image ${image.id}:`, e);
        }
        
        // Map image data to Firebase structure
        const imageData = {
          title: image.title,
          imageUrl: imageUrl,
          storageRef: image.storage_key || null,
          categoryId: image.category_id ? image.category_id.toString() : null,
          answers: answers,
          hints: hints || [],
          difficulty: image.difficulty || 1,
          playCount: image.play_count || 0,
          likeCount: image.like_count || 0,
          active: image.active !== false,
          createdBy: image.created_by ? image.created_by.toString() : null,
          createdAt: image.created_at ? new Date(image.created_at) : admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: image.updated_at ? new Date(image.updated_at) : null
        };
        
        await imageRef.set(imageData);
        stats.images.migrated++;
      } catch (err) {
        console.error(`Error processing image ${image.id}:`, err);
        stats.images.errors++;
      }
    }
    
    console.log(`Migrated ${stats.images.migrated} of ${stats.images.total} images`);
  } catch (error) {
    console.error('Error migrating images:', error);
  }
}

// Migrate tests
async function migrateTests() {
  console.log('Migrating tests...');
  
  try {
    // Get tests from Supabase
    const { data: tests, error } = await supabase
      .from('tests')
      .select('*');
    
    if (error) throw error;
    stats.tests.total = tests.length;
    
    // Process each test (not in batch due to potential file uploads)
    for (const test of tests) {
      try {
        const testRef = db.collection('tests').doc(test.id.toString());
        
        // Migrate thumbnail if exists
        let thumbnailUrl = test.thumbnail || test.image_url;
        if (thumbnailUrl && thumbnailUrl.startsWith('http')) {
          const newThumbnailUrl = await migrateFile(
            thumbnailUrl, 
            `test-thumbnails/${test.id}/${path.basename(thumbnailUrl)}`
          );
          if (newThumbnailUrl) thumbnailUrl = newThumbnailUrl;
        }
        
        // Process image IDs and questions
        let imageIds = [];
        let questions = [];
        
        // Handle image_ids
        try {
          if (test.image_ids) {
            if (typeof test.image_ids === 'string') {
              imageIds = JSON.parse(test.image_ids);
            } else if (Array.isArray(test.image_ids)) {
              imageIds = test.image_ids;
            }
          }
        } catch (e) {
          console.warn(`Could not parse image_ids for test ${test.id}:`, e);
        }
        
        // Handle questions
        try {
          if (test.questions) {
            if (typeof test.questions === 'string') {
              questions = JSON.parse(test.questions);
            } else {
              questions = test.questions;
            }
          } else if (imageIds.length > 0) {
            // If no questions but we have imageIds, try to create questions from images
            const imagePromises = imageIds.map(async (imageId) => {
              const { data: image } = await supabase
                .from('images')
                .select('*')
                .eq('id', imageId)
                .single();
                
              if (image) {
                return {
                  imageUrl: image.image_url,
                  answers: typeof image.answers === 'string' ? JSON.parse(image.answers) : image.answers,
                  question: "Bu görselde ne görüyorsunuz?"
                };
              }
              return null;
            });
            
            const imageResults = await Promise.all(imagePromises);
            questions = imageResults.filter(q => q !== null);
          }
        } catch (e) {
          console.warn(`Could not process questions for test ${test.id}:`, e);
        }
        
        // Map test data to Firebase structure
        const testData = {
          uuid: test.uuid || `test-${test.id}`,
          title: test.title,
          description: test.description || '',
          creatorId: test.creator_id ? test.creator_id.toString() : null,
          categoryId: test.category_id ? test.category_id.toString() : null,
          questions: questions,
          thumbnailUrl: thumbnailUrl || null,
          playCount: test.play_count || 0,
          likeCount: test.like_count || 0,
          isPublic: test.is_public !== false,
          isAnonymous: test.is_anonymous === true,
          approved: test.approved === true,
          featured: test.featured === true,
          difficulty: test.difficulty || 2,
          createdAt: test.created_at ? new Date(test.created_at) : admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: test.updated_at ? new Date(test.updated_at) : null
        };
        
        await testRef.set(testData);
        stats.tests.migrated++;
      } catch (err) {
        console.error(`Error processing test ${test.id}:`, err);
        stats.tests.errors++;
      }
    }
    
    console.log(`Migrated ${stats.tests.migrated} of ${stats.tests.total} tests`);
  } catch (error) {
    console.error('Error migrating tests:', error);
  }
}

// Migrate test comments
async function migrateTestComments() {
  console.log('Migrating test comments...');
  
  try {
    // Get comments from Supabase
    const { data: comments, error } = await supabase
      .from('test_comments')
      .select('*');
    
    if (error) throw error;
    stats.testComments.total = comments.length;
    
    // Create a batch for Firebase
    const batch = db.batch();
    let currentBatch = 0;
    const BATCH_SIZE = 500; // Firestore batch limit
    
    // Process each comment
    for (const comment of comments) {
      try {
        // Create a new document with auto-generated ID
        const commentRef = db.collection('testComments').doc();
        
        // Map comment data to Firebase structure
        const commentData = {
          testId: comment.test_id.toString(),
          userId: comment.user_id ? comment.user_id.toString() : null,
          comment: comment.comment || comment.content || '',
          createdAt: comment.created_at ? new Date(comment.created_at) : admin.firestore.FieldValue.serverTimestamp()
        };
        
        batch.set(commentRef, commentData);
        stats.testComments.migrated++;
        
        // Commit batch if we've reached the limit
        currentBatch++;
        if (currentBatch >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Committed batch of ${currentBatch} comments`);
          currentBatch = 0;
        }
      } catch (err) {
        console.error(`Error processing comment ${comment.id}:`, err);
        stats.testComments.errors++;
      }
    }
    
    // Commit any remaining documents
    if (currentBatch > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${currentBatch} comments`);
    }
    
    console.log(`Migrated ${stats.testComments.migrated} of ${stats.testComments.total} test comments`);
  } catch (error) {
    console.error('Error migrating test comments:', error);
  }
}

// Migrate game scores
async function migrateGameScores() {
  console.log('Migrating game scores...');
  
  try {
    // Get scores from Supabase
    const { data: scores, error } = await supabase
      .from('game_scores')
      .select('*');
    
    if (error) throw error;
    stats.gameScores.total = scores.length;
    
    // Create a batch for Firebase
    const batch = db.batch();
    let currentBatch = 0;
    const BATCH_SIZE = 500; // Firestore batch limit
    
    // Process each score
    for (const score of scores) {
      try {
        // Create a new document with auto-generated ID
        const scoreRef = db.collection('gameScores').doc();
        
        // Parse details if needed
        let details = null;
        if (score.details) {
          try {
            details = typeof score.details === 'string' ? JSON.parse(score.details) : score.details;
          } catch (e) {
            console.warn(`Could not parse details for score ${score.id}:`, e);
          }
        }
        
        // Map score data to Firebase structure
        const scoreData = {
          userId: score.user_id ? score.user_id.toString() : null,
          testId: score.test_id ? score.test_id.toString() : null,
          gameMode: score.game_mode || 'classic',
          score: score.score || 0,
          completionTime: score.completion_time || null,
          attemptsCount: score.attempts_count || 1,
          completed: score.completed === true,
          details: details,
          createdAt: score.created_at ? new Date(score.created_at) : admin.firestore.FieldValue.serverTimestamp()
        };
        
        batch.set(scoreRef, scoreData);
        stats.gameScores.migrated++;
        
        // Commit batch if we've reached the limit
        currentBatch++;
        if (currentBatch >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Committed batch of ${currentBatch} scores`);
          currentBatch = 0;
        }
      } catch (err) {
        console.error(`Error processing score ${score.id}:`, err);
        stats.gameScores.errors++;
      }
    }
    
    // Commit any remaining documents
    if (currentBatch > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${currentBatch} scores`);
    }
    
    console.log(`Migrated ${stats.gameScores.migrated} of ${stats.gameScores.total} game scores`);
  } catch (error) {
    console.error('Error migrating game scores:', error);
  }
}

// Migrate user activities
async function migrateUserActivities() {
  console.log('Migrating user activities...');
  
  try {
    // Get activities from Supabase
    const { data: activities, error } = await supabase
      .from('user_activities')
      .select('*');
    
    if (error) throw error;
    stats.userActivities.total = activities.length;
    
    // Create a batch for Firebase
    const batch = db.batch();
    let currentBatch = 0;
    const BATCH_SIZE = 500; // Firestore batch limit
    
    // Process each activity
    for (const activity of activities) {
      try {
        // Create a new document with auto-generated ID
        const activityRef = db.collection('userActivities').doc();
        
        // Parse metadata if needed
        let metadata = null;
        if (activity.metadata) {
          try {
            metadata = typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata;
          } catch (e) {
            console.warn(`Could not parse metadata for activity ${activity.id}:`, e);
          }
        }
        
        // Map activity data to Firebase structure
        const activityData = {
          userId: activity.user_id ? activity.user_id.toString() : null,
          userName: activity.user_name || null,
          activityType: activity.activity_type,
          details: activity.details || null,
          entityId: activity.entity_id ? activity.entity_id.toString() : null,
          entityType: activity.entity_type || null,
          metadata: metadata,
          createdAt: activity.created_at ? new Date(activity.created_at) : admin.firestore.FieldValue.serverTimestamp()
        };
        
        batch.set(activityRef, activityData);
        stats.userActivities.migrated++;
        
        // Commit batch if we've reached the limit
        currentBatch++;
        if (currentBatch >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Committed batch of ${currentBatch} activities`);
          currentBatch = 0;
        }
      } catch (err) {
        console.error(`Error processing activity ${activity.id}:`, err);
        stats.userActivities.errors++;
      }
    }
    
    // Commit any remaining documents
    if (currentBatch > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${currentBatch} activities`);
    }
    
    console.log(`Migrated ${stats.userActivities.migrated} of ${stats.userActivities.total} user activities`);
  } catch (error) {
    console.error('Error migrating user activities:', error);
  }
}

// Run the migration
async function runMigration() {
  console.log('Starting migration from Supabase to Firebase...');
  
  try {
    // Run migrations in sequence
    await migrateUsers();
    await migrateCategories();
    await migrateImages();
    await migrateTests();
    await migrateTestComments();
    await migrateGameScores();
    await migrateUserActivities();
    
    // Print migration summary
    console.log('\n=== Migration Summary ===');
    for (const [entity, data] of Object.entries(stats)) {
      console.log(`${entity}: ${data.migrated}/${data.total} migrated, ${data.errors} errors`);
    }
    
    console.log('\nMigration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();