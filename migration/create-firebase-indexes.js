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

async function createIndexes() {
  console.log('Creating Firestore indexes...');
  
  try {
    // Note: Firestore indexes are typically created through the Firebase console
    // or using the firebase.json configuration file.
    // This script is for documentation purposes to show which indexes are needed.
    
    console.log(`
    The following indexes should be created in Firebase:
    
    1. Collection: tests
       Fields: isPublic (Ascending), approved (Ascending), playCount (Descending)
       
    2. Collection: tests
       Fields: isPublic (Ascending), approved (Ascending), createdAt (Descending)
       
    3. Collection: tests
       Fields: isPublic (Ascending), approved (Ascending), featured (Ascending), createdAt (Descending)
       
    4. Collection: tests
       Fields: categoryId (Ascending), isPublic (Ascending), createdAt (Descending)
       
    5. Collection: gameScores
       Fields: testId (Ascending), score (Descending)
       
    6. Collection: userActivities
       Fields: userId (Ascending), createdAt (Descending)
    
    These indexes have been defined in firebase/firestore.indexes.json and will be deployed
    when you run 'firebase deploy'.
    `);
    
    console.log('Indexes documentation complete!');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

createIndexes();