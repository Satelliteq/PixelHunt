const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');
require('dotenv').config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'pixelhunt-7afa8.appspot.com'
  });
}

const db = admin.firestore();

async function verifyMigration() {
  console.log('Verifying Firebase migration...');
  
  try {
    // Check users collection
    const usersSnapshot = await db.collection('users').limit(5).get();
    console.log(`Users collection: ${usersSnapshot.size} documents found`);
    if (usersSnapshot.size > 0) {
      console.log('Sample user:', usersSnapshot.docs[0].data());
    }
    
    // Check categories collection
    const categoriesSnapshot = await db.collection('categories').limit(5).get();
    console.log(`Categories collection: ${categoriesSnapshot.size} documents found`);
    if (categoriesSnapshot.size > 0) {
      console.log('Sample category:', categoriesSnapshot.docs[0].data());
    }
    
    // Check images collection
    const imagesSnapshot = await db.collection('images').limit(5).get();
    console.log(`Images collection: ${imagesSnapshot.size} documents found`);
    if (imagesSnapshot.size > 0) {
      console.log('Sample image:', imagesSnapshot.docs[0].data());
    }
    
    // Check tests collection
    const testsSnapshot = await db.collection('tests').limit(5).get();
    console.log(`Tests collection: ${testsSnapshot.size} documents found`);
    if (testsSnapshot.size > 0) {
      console.log('Sample test:', testsSnapshot.docs[0].data());
    }
    
    // Check testComments collection
    const commentsSnapshot = await db.collection('testComments').limit(5).get();
    console.log(`Test comments collection: ${commentsSnapshot.size} documents found`);
    
    // Check gameScores collection
    const scoresSnapshot = await db.collection('gameScores').limit(5).get();
    console.log(`Game scores collection: ${scoresSnapshot.size} documents found`);
    
    // Check userActivities collection
    const activitiesSnapshot = await db.collection('userActivities').limit(5).get();
    console.log(`User activities collection: ${activitiesSnapshot.size} documents found`);
    
    console.log('\nMigration verification complete!');
  } catch (error) {
    console.error('Error verifying migration:', error);
  }
}

verifyMigration();