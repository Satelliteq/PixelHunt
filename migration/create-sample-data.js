import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { createId } from '@paralleldrive/cuid2';

// Initialize environment variables
config();

// Get current file directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    fs.readFileSync(path.join(__dirname, './firebase-service-account.json'), 'utf8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'pixelhunt-7afa8.appspot.com'
  });
}

const db = admin.firestore();

async function createSampleData() {
  console.log('Creating sample data in Firebase...');
  
  try {
    // Check if we already have data
    const usersSnapshot = await db.collection('users').limit(1).get();
    if (!usersSnapshot.empty) {
      console.log('Data already exists in Firebase. Skipping sample data creation.');
      return;
    }
    
    // Create sample categories
    console.log('Creating sample categories...');
    const categories = [
      {
        name: 'Arabalar',
        description: 'Otomobil markaları ve modelleri',
        iconName: 'car',
        color: '#FF5722',
        backgroundColor: '#FFF3F0',
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Coğrafya',
        description: 'Dünya üzerindeki yerler ve landmark\'lar',
        iconName: 'globe',
        color: '#4CAF50',
        backgroundColor: '#E8F5E9',
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Film & TV',
        description: 'Filmler, TV şovları ve karakterler',
        iconName: 'film',
        color: '#2196F3',
        backgroundColor: '#E3F2FD',
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Sanat',
        description: 'Ünlü sanat eserleri ve sanatçılar',
        iconName: 'palette',
        color: '#9C27B0',
        backgroundColor: '#F3E5F5',
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Oyunlar',
        description: 'Video oyunları ve karakterleri',
        iconName: 'gamepad',
        color: '#FFC107',
        backgroundColor: '#FFF8E1',
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    const categoryRefs = {};
    for (const category of categories) {
      const docRef = await db.collection('categories').add(category);
      categoryRefs[category.name] = docRef.id;
      console.log(`Created category: ${category.name} (${docRef.id})`);
    }
    
    // Create sample admin user
    console.log('Creating sample admin user...');
    const adminUser = {
      uid: createId(),
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      score: 1000,
      banned: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const adminUserRef = await db.collection('users').add(adminUser);
    console.log(`Created admin user: ${adminUserRef.id}`);
    
    // Create sample images
    console.log('Creating sample images...');
    const images = [
      {
        title: 'Ferrari 458',
        imageUrl: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500',
        categoryId: categoryRefs['Arabalar'],
        answers: ['Ferrari', 'Ferrari 458', '458 Italia'],
        difficulty: 2,
        playCount: 120,
        likeCount: 45,
        active: true,
        createdBy: adminUserRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'İstanbul Boğazı',
        imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=500',
        categoryId: categoryRefs['Coğrafya'],
        answers: ['İstanbul', 'Istanbul', 'Boğaz', 'Bogazici', 'Bosphorus'],
        difficulty: 1,
        playCount: 200,
        likeCount: 78,
        active: true,
        createdBy: adminUserRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Star Wars - Darth Vader',
        imageUrl: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=500',
        categoryId: categoryRefs['Film & TV'],
        answers: ['Star Wars', 'Darth Vader', 'Vader'],
        difficulty: 2,
        playCount: 180,
        likeCount: 95,
        active: true,
        createdBy: adminUserRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    const imageRefs = {};
    for (const image of images) {
      const docRef = await db.collection('images').add(image);
      imageRefs[image.title] = docRef.id;
      console.log(`Created image: ${image.title} (${docRef.id})`);
    }
    
    // Create sample tests
    console.log('Creating sample tests...');
    const tests = [
      {
        uuid: createId(),
        title: 'Arabalar Testi',
        description: 'Otomobil markaları ve modelleri hakkında bilginizi test edin',
        creatorId: adminUserRef.id,
        categoryId: categoryRefs['Arabalar'],
        questions: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500',
            answers: ['Ferrari', 'Ferrari 458', '458 Italia'],
            question: 'Bu görselde ne görüyorsunuz?'
          }
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500',
        playCount: 50,
        likeCount: 20,
        isPublic: true,
        isAnonymous: false,
        approved: true,
        featured: true,
        difficulty: 2,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        uuid: createId(),
        title: 'Dünya Coğrafyası',
        description: 'Dünya üzerindeki önemli yerleri tanıyabilecek misiniz?',
        creatorId: adminUserRef.id,
        categoryId: categoryRefs['Coğrafya'],
        questions: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=500',
            answers: ['İstanbul', 'Istanbul', 'Boğaz', 'Bogazici', 'Bosphorus'],
            question: 'Bu görselde hangi şehir görünüyor?'
          }
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=500',
        playCount: 35,
        likeCount: 15,
        isPublic: true,
        isAnonymous: false,
        approved: true,
        featured: false,
        difficulty: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    for (const test of tests) {
      const docRef = await db.collection('tests').add(test);
      console.log(`Created test: ${test.title} (${docRef.id})`);
    }
    
    console.log('Sample data creation complete!');
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

createSampleData();