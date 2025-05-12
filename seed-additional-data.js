import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { createId } from '@paralleldrive/cuid2';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtHxrkA9kcUQZyJp9bA48Evyt5U-7AVoQ",
  authDomain: "pixelhunt-7afa8.firebaseapp.com",
  projectId: "pixelhunt-7afa8",
  storageBucket: "pixelhunt-7afa8.appspot.com",
  messagingSenderId: "595531085941",
  appId: "1:595531085941:web:9bd7b5f890098211d2a03c",
  databaseURL: "https://pixelhunt-7afa8-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Seed additional data function
async function seedAdditionalData() {
  try {
    console.log('Starting to seed additional data to Firestore database...');
    
    // Get all categories for reference
    const allCategoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categoryRefs = {};
    allCategoriesSnapshot.forEach(doc => {
      const data = doc.data();
      categoryRefs[data.name] = doc.id;
    });
    
    // Add more categories if needed
    const additionalCategories = [
      {
        name: 'Yemekler',
        description: 'Dünya mutfaklarından yemekler',
        iconName: 'utensils',
        color: '#D946EF', // fuchsia-500
        backgroundColor: '#FAE8FF', // fuchsia-50
        active: true,
        createdAt: serverTimestamp()
      },
      {
        name: 'Hayvanlar',
        description: 'Vahşi yaşam ve evcil hayvanlar',
        iconName: 'paw',
        color: '#F97316', // orange-500
        backgroundColor: '#FFF7ED', // orange-50
        active: true,
        createdAt: serverTimestamp()
      },
      {
        name: 'Mimari',
        description: 'Ünlü yapılar ve mimari eserler',
        iconName: 'building',
        color: '#0EA5E9', // sky-500
        backgroundColor: '#F0F9FF', // sky-50
        active: true,
        createdAt: serverTimestamp()
      }
    ];
    
    for (const category of additionalCategories) {
      // Check if category already exists
      const categoryQuery = query(
        collection(db, 'categories'),
        where('name', '==', category.name)
      );
      const categoryQuerySnapshot = await getDocs(categoryQuery);
      
      if (categoryQuerySnapshot.empty) {
        const docRef = await addDoc(collection(db, 'categories'), category);
        console.log(`Added additional category: ${category.name} with ID: ${docRef.id}`);
        categoryRefs[category.name] = docRef.id;
      } else {
        console.log(`Category ${category.name} already exists, skipping`);
      }
    }
    
    // Add more sample images
    const additionalImagesData = [
      {
        title: 'Pasta',
        imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500',
        categoryId: categoryRefs['Yemekler'],
        answers: ['Pasta', 'Cake', 'Doğum Günü Pastası', 'Birthday Cake'],
        difficulty: 1,
        playCount: 130,
        likeCount: 55,
        active: true,
        createdAt: serverTimestamp()
      },
      {
        title: 'Kedi',
        imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500',
        categoryId: categoryRefs['Hayvanlar'],
        answers: ['Kedi', 'Cat', 'Tekir'],
        difficulty: 1,
        playCount: 170,
        likeCount: 90,
        active: true,
        createdAt: serverTimestamp()
      },
      {
        title: 'Eyfel Kulesi',
        imageUrl: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=500',
        categoryId: categoryRefs['Mimari'],
        answers: ['Eyfel Kulesi', 'Eiffel Tower', 'Eyfel', 'Eiffel'],
        difficulty: 1,
        playCount: 145,
        likeCount: 65,
        active: true,
        createdAt: serverTimestamp()
      },
      {
        title: 'Köpek',
        imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=500',
        categoryId: categoryRefs['Hayvanlar'],
        answers: ['Köpek', 'Dog', 'Pug'],
        difficulty: 1,
        playCount: 155,
        likeCount: 75,
        active: true,
        createdAt: serverTimestamp()
      },
      {
        title: 'Pizza',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500',
        categoryId: categoryRefs['Yemekler'],
        answers: ['Pizza', 'Pepperoni Pizza'],
        difficulty: 1,
        playCount: 140,
        likeCount: 60,
        active: true,
        createdAt: serverTimestamp()
      }
    ];
    
    for (const image of additionalImagesData) {
      // Check if image already exists
      const imageQuery = query(
        collection(db, 'images'),
        where('title', '==', image.title)
      );
      const imageQuerySnapshot = await getDocs(imageQuery);
      
      if (imageQuerySnapshot.empty) {
        const docRef = await addDoc(collection(db, 'images'), image);
        console.log(`Added additional image: ${image.title} with ID: ${docRef.id}`);
      } else {
        console.log(`Image ${image.title} already exists, skipping`);
      }
    }
    
    // Add more sample tests
    const additionalTestsData = [
      {
        uuid: createId(),
        title: 'Yemekler Testi',
        description: 'Dünya mutfaklarından yemekleri tanıyabilecek misiniz?',
        creatorId: null,
        categoryId: categoryRefs['Yemekler'],
        questions: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500',
            answers: ['Pasta', 'Cake', 'Doğum Günü Pastası', 'Birthday Cake'],
            question: 'Bu görselde ne görüyorsunuz?'
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500',
            answers: ['Pizza', 'Pepperoni Pizza'],
            question: 'Bu yemek nedir?'
          }
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500',
        playCount: 30,
        likeCount: 12,
        isPublic: true,
        isAnonymous: false,
        approved: true,
        featured: false,
        difficulty: 1,
        createdAt: serverTimestamp()
      },
      {
        uuid: createId(),
        title: 'Hayvanlar Testi',
        description: 'Sevimli hayvanları tanıyabilecek misiniz?',
        creatorId: null,
        categoryId: categoryRefs['Hayvanlar'],
        questions: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500',
            answers: ['Kedi', 'Cat', 'Tekir'],
            question: 'Bu hangi hayvan?'
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=500',
            answers: ['Köpek', 'Dog', 'Pug'],
            question: 'Bu görselde hangi hayvan var?'
          }
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500',
        playCount: 48,
        likeCount: 22,
        isPublic: true,
        isAnonymous: false,
        approved: true,
        featured: true,
        difficulty: 1,
        createdAt: serverTimestamp()
      },
      {
        uuid: createId(),
        title: 'Mimari Harikalar Testi',
        description: 'Dünyanın en ünlü mimari yapılarını tanıyabilecek misiniz?',
        creatorId: null,
        categoryId: categoryRefs['Mimari'],
        questions: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=500',
            answers: ['Eyfel Kulesi', 'Eiffel Tower', 'Eyfel', 'Eiffel'],
            question: 'Bu ünlü yapı nedir?'
          }
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=500',
        playCount: 36,
        likeCount: 14,
        isPublic: true,
        isAnonymous: false,
        approved: true,
        featured: false,
        difficulty: 1,
        createdAt: serverTimestamp()
      }
    ];
    
    for (const test of additionalTestsData) {
      // Check if test already exists
      const testQuery = query(
        collection(db, 'tests'),
        where('title', '==', test.title)
      );
      const testQuerySnapshot = await getDocs(testQuery);
      
      if (testQuerySnapshot.empty) {
        const docRef = await addDoc(collection(db, 'tests'), test);
        console.log(`Added additional test: ${test.title} with ID: ${docRef.id}`);
      } else {
        console.log(`Test ${test.title} already exists, skipping`);
      }
    }
    
    console.log('✅ All additional sample data added successfully to Firestore!');
  } catch (error) {
    console.error('Error seeding additional data to Firestore database:', error);
  }
}

// Run the seed function
seedAdditionalData();