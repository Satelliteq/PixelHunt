import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { createId } from '@paralleldrive/cuid2';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBtHxrkA9kcUQZyJp9bA48Evyt5U-7AVoQ",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "pixelhunt-7afa8.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "pixelhunt-7afa8",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "pixelhunt-7afa8.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "595531085941",
  appId: process.env.FIREBASE_APP_ID || "1:595531085941:web:9bd7b5f890098211d2a03c",
  databaseURL: "https://pixelhunt-7afa8-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function createSampleData() {
  try {
    console.log('Creating sample data in Firebase Realtime Database...');
    
    // Sample categories
    const categories = {
      'cat1': {
        name: 'Filmler',
        description: 'Film ve sinema dünyası',
        iconName: 'film',
        color: '#3B82F6',
        active: true,
        createdAt: new Date().toISOString()
      },
      'cat2': {
        name: 'Sanat',
        description: 'Sanat eserleri ve sanatçılar',
        iconName: 'palette',
        color: '#EC4899',
        active: true,
        createdAt: new Date().toISOString()
      },
      'cat3': {
        name: 'Coğrafya',
        description: 'Dünya üzerindeki yerler',
        iconName: 'globe',
        color: '#10B981',
        active: true,
        createdAt: new Date().toISOString()
      },
      'cat4': {
        name: 'Oyunlar',
        description: 'Video oyunları ve karakterleri',
        iconName: 'gamepad',
        color: '#F59E0B',
        active: true,
        createdAt: new Date().toISOString()
      },
      'cat5': {
        name: 'Müzik',
        description: 'Müzik dünyası ve sanatçılar',
        iconName: 'music',
        color: '#8B5CF6',
        active: true,
        createdAt: new Date().toISOString()
      }
    };
    
    // Sample images
    const images = {
      'img1': {
        title: 'Ferrari 458',
        imageUrl: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500',
        categoryId: 'cat1',
        answers: ['Ferrari', 'Ferrari 458', '458 Italia'],
        difficulty: 2,
        playCount: 120,
        likeCount: 45,
        active: true,
        createdAt: new Date().toISOString()
      },
      'img2': {
        title: 'İstanbul Boğazı',
        imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=500',
        categoryId: 'cat3',
        answers: ['İstanbul', 'Istanbul', 'Boğaz', 'Bogazici', 'Bosphorus'],
        difficulty: 1,
        playCount: 200,
        likeCount: 78,
        active: true,
        createdAt: new Date().toISOString()
      },
      'img3': {
        title: 'Star Wars - Darth Vader',
        imageUrl: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=500',
        categoryId: 'cat1',
        answers: ['Star Wars', 'Darth Vader', 'Vader'],
        difficulty: 2,
        playCount: 180,
        likeCount: 95,
        active: true,
        createdAt: new Date().toISOString()
      },
      'img4': {
        title: 'Mona Lisa',
        imageUrl: 'https://images.unsplash.com/photo-1423742774270-6884aac775fa?w=500',
        categoryId: 'cat2',
        answers: ['Mona Lisa', 'Leonardo da Vinci', 'da Vinci'],
        difficulty: 1,
        playCount: 150,
        likeCount: 67,
        active: true,
        createdAt: new Date().toISOString()
      },
      'img5': {
        title: 'Minecraft',
        imageUrl: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=500',
        categoryId: 'cat4',
        answers: ['Minecraft', 'Mine Craft'],
        difficulty: 1,
        playCount: 250,
        likeCount: 120,
        active: true,
        createdAt: new Date().toISOString()
      }
    };
    
    // Sample tests
    const tests = {
      'test1': {
        uuid: createId(),
        title: 'Klasik Filmler Testi',
        description: 'Popüler klasik filmleri tahmin edin',
        categoryId: 'cat1',
        questions: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=500',
            answers: ['Star Wars', 'Darth Vader', 'Vader'],
            question: 'Bu görselde ne görüyorsunuz?'
          }
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=500',
        playCount: 50,
        likeCount: 20,
        isPublic: true,
        isAnonymous: false,
        approved: true,
        featured: true,
        difficulty: 2,
        createdAt: new Date().toISOString()
      },
      'test2': {
        uuid: createId(),
        title: 'Dünya Coğrafyası',
        description: 'Dünya üzerindeki önemli yerleri tanıyabilecek misiniz?',
        categoryId: 'cat3',
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
        createdAt: new Date().toISOString()
      },
      'test3': {
        uuid: createId(),
        title: 'Sanat Eserleri',
        description: 'Ünlü sanat eserlerini tanıyabilecek misiniz?',
        categoryId: 'cat2',
        questions: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1423742774270-6884aac775fa?w=500',
            answers: ['Mona Lisa', 'Leonardo da Vinci', 'da Vinci'],
            question: 'Bu ünlü tablo nedir?'
          }
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1423742774270-6884aac775fa?w=500',
        playCount: 42,
        likeCount: 18,
        isPublic: true,
        isAnonymous: false,
        approved: true,
        featured: true,
        difficulty: 1,
        createdAt: new Date().toISOString()
      },
      'test4': {
        uuid: createId(),
        title: 'Video Oyunları',
        description: 'Popüler video oyunlarını tanıyabilecek misiniz?',
        categoryId: 'cat4',
        questions: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=500',
            answers: ['Minecraft', 'Mine Craft'],
            question: 'Bu hangi oyun?'
          }
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=500',
        playCount: 65,
        likeCount: 30,
        isPublic: true,
        isAnonymous: false,
        approved: true,
        featured: false,
        difficulty: 1,
        createdAt: new Date().toISOString()
      }
    };
    
    // Write data to Realtime Database
    await set(ref(database, 'categories'), categories);
    await set(ref(database, 'images'), images);
    await set(ref(database, 'tests'), tests);
    
    console.log('Sample data created successfully in Firebase Realtime Database!');
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

createSampleData();