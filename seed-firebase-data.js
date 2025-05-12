import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp, getDocs, query, where, limit } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtHxrkA9kcUQZyJp9bA48Evyt5U-7AVoQ",
  authDomain: "pixelhunt-7afa8.firebaseapp.com",
  projectId: "pixelhunt-7afa8",
  storageBucket: "pixelhunt-7afa8.appspot.com",
  messagingSenderId: "595531085941",
  appId: "1:595531085941:web:9bd7b5f890098211d2a03c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample users
const users = [
  {
    id: 'admin',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    score: 1000,
    avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=random',
    banned: false,
    lastLoginAt: Timestamp.now(),
    createdAt: Timestamp.now()
  },
  {
    id: 'test_user',
    username: 'test_user',
    email: 'user@example.com',
    role: 'user',
    score: 500,
    avatarUrl: 'https://ui-avatars.com/api/?name=Test+User&background=random',
    banned: false,
    lastLoginAt: Timestamp.now(),
    createdAt: Timestamp.now()
  }
];

// Sample categories
const categories = [
  {
    id: 'cars',
    name: 'Arabalar',
    description: 'Otomobil markaları ve modelleri',
    iconName: 'car',
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    active: true,
    createdAt: Timestamp.now()
  },
  {
    id: 'geography',
    name: 'Coğrafya',
    description: 'Dünya üzerindeki yerler ve landmark\'lar',
    iconName: 'globe',
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    active: true,
    createdAt: Timestamp.now()
  },
  {
    id: 'movies',
    name: 'Film & TV',
    description: 'Filmler, TV şovları ve karakterler',
    iconName: 'film',
    color: '#8B5CF6',
    backgroundColor: '#F5F3FF',
    active: true,
    createdAt: Timestamp.now()
  },
  {
    id: 'art',
    name: 'Sanat',
    description: 'Ünlü sanat eserleri ve sanatçılar',
    iconName: 'palette',
    color: '#EC4899',
    backgroundColor: '#FDF2F8',
    active: true,
    createdAt: Timestamp.now()
  },
  {
    id: 'games',
    name: 'Oyunlar',
    description: 'Video oyunları ve karakterleri',
    iconName: 'gamepad',
    color: '#10B981',
    backgroundColor: '#ECFDF5',
    active: true,
    createdAt: Timestamp.now()
  }
];

// Sample images
const images = [
  {
    id: 'ferrari',
    title: 'Ferrari 458',
    imageUrl: '/attached_assets/ba1f50f644077acc8bedb8b0634c1af8.jpg',
    categoryId: 'cars',
    answers: ['Ferrari', 'Ferrari 458', '458 Italia'],
    difficulty: 2,
    playCount: 120,
    likeCount: 45,
    active: true,
    createdAt: Timestamp.now()
  },
  {
    id: 'istanbul',
    title: 'İstanbul Boğazı',
    imageUrl: '/attached_assets/86b4065a7c34a1c78de57b71078b4f5b.jpg',
    categoryId: 'geography',
    answers: ['İstanbul', 'Istanbul', 'Boğaz', 'Bogazici', 'Bosphorus'],
    difficulty: 1,
    playCount: 200,
    likeCount: 78,
    active: true,
    createdAt: Timestamp.now()
  },
  {
    id: 'starwars',
    title: 'Star Wars - Darth Vader',
    imageUrl: '/attached_assets/6c161a984b072640f8d7cde4b759f0a8.jpg',
    categoryId: 'movies',
    answers: ['Star Wars', 'Darth Vader', 'Vader'],
    difficulty: 2,
    playCount: 180,
    likeCount: 95,
    active: true,
    createdAt: Timestamp.now()
  }
];

// Sample tests
const tests = [
  {
    id: 'car-test',
    uuid: 'car-test-uuid',
    title: 'Arabalar Testi',
    description: 'Otomobil markaları ve modelleri hakkında bilginizi test edin',
    categoryId: 'cars',
    creatorId: 'admin',
    questions: [
      {
        imageUrl: '/attached_assets/ba1f50f644077acc8bedb8b0634c1af8.jpg',
        answers: ['Ferrari', 'Ferrari 458', '458 Italia'],
        question: 'Bu görselde ne görüyorsunuz?'
      }
    ],
    thumbnailUrl: '/attached_assets/ba1f50f644077acc8bedb8b0634c1af8.jpg',
    playCount: 50,
    likeCount: 20,
    isPublic: true,
    isAnonymous: false,
    approved: true,
    featured: true,
    difficulty: 2,
    createdAt: Timestamp.now()
  },
  {
    id: 'geography-test',
    uuid: 'geography-test-uuid',
    title: 'Dünya Coğrafyası',
    description: 'Dünya üzerindeki önemli yerleri tanıyabilecek misiniz?',
    categoryId: 'geography',
    creatorId: 'admin',
    questions: [
      {
        imageUrl: '/attached_assets/86b4065a7c34a1c78de57b71078b4f5b.jpg',
        answers: ['İstanbul', 'Istanbul', 'Boğaz', 'Bogazici', 'Bosphorus'],
        question: 'Bu görselde hangi şehir görünüyor?'
      }
    ],
    thumbnailUrl: '/attached_assets/86b4065a7c34a1c78de57b71078b4f5b.jpg',
    playCount: 35,
    likeCount: 15,
    isPublic: true,
    isAnonymous: false,
    approved: true,
    featured: false,
    difficulty: 1,
    createdAt: Timestamp.now()
  },
  {
    id: 'movie-test',
    uuid: 'movie-test-uuid',
    title: 'Film Karakterleri',
    description: 'Popüler film karakterlerini tanıyabilecek misiniz?',
    categoryId: 'movies',
    creatorId: 'admin',
    questions: [
      {
        imageUrl: '/attached_assets/6c161a984b072640f8d7cde4b759f0a8.jpg',
        answers: ['Star Wars', 'Darth Vader', 'Vader'],
        question: 'Bu görselde hangi film karakteri görünüyor?'
      }
    ],
    thumbnailUrl: '/attached_assets/6c161a984b072640f8d7cde4b759f0a8.jpg',
    playCount: 65,
    likeCount: 30,
    isPublic: true,
    isAnonymous: false,
    approved: true,
    featured: true,
    difficulty: 2,
    createdAt: Timestamp.now()
  }
];

// Check if data already exists before adding
async function checkCollectionEmpty(collectionName) {
  const querySnapshot = await getDocs(query(collection(db, collectionName), limit(1)));
  return querySnapshot.empty;
}

// Add data to Firestore
async function seedData() {
  try {
    // Check if collections are empty before adding data
    const categoriesEmpty = await checkCollectionEmpty('categories');
    const usersEmpty = await checkCollectionEmpty('users');
    const imagesEmpty = await checkCollectionEmpty('images');
    const testsEmpty = await checkCollectionEmpty('tests');
    
    // Add users if collection is empty
    if (usersEmpty) {
      console.log('Adding users...');
      for (const user of users) {
        await setDoc(doc(db, 'users', user.id), user);
      }
      console.log('✅ Users added successfully');
    } else {
      console.log('⏭️ Users collection already has data, skipping...');
    }

    // Add categories if collection is empty
    if (categoriesEmpty) {
      console.log('Adding categories...');
      for (const category of categories) {
        await setDoc(doc(db, 'categories', category.id), category);
      }
      console.log('✅ Categories added successfully');
    } else {
      console.log('⏭️ Categories collection already has data, skipping...');
    }

    // Add images if collection is empty
    if (imagesEmpty) {
      console.log('Adding images...');
      for (const image of images) {
        await setDoc(doc(db, 'images', image.id), image);
      }
      console.log('✅ Images added successfully');
    } else {
      console.log('⏭️ Images collection already has data, skipping...');
    }

    // Add tests if collection is empty
    if (testsEmpty) {
      console.log('Adding tests...');
      for (const test of tests) {
        await setDoc(doc(db, 'tests', test.id), test);
      }
      console.log('✅ Tests added successfully');
    } else {
      console.log('⏭️ Tests collection already has data, skipping...');
    }

    console.log('🎉 All sample data has been added to Firestore!');
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
}

// Run the seed function
seedData();