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

// Seed data function
async function seedData() {
  try {
    console.log('Starting to seed Firestore database...');
    
    // Check if categories already exist
    const categoriesRef = collection(db, 'categories');
    const categoriesSnapshot = await getDocs(categoriesRef);
    
    let categoryRefs = {};
    
    if (categoriesSnapshot.empty) {
      // Add categories
      console.log('Adding categories...');
      const categoriesData = [
        {
          name: 'Arabalar',
          description: 'Otomobil markaları ve modelleri',
          iconName: 'car',
          color: '#EF4444', // red-500
          backgroundColor: '#FEF2F2', // red-50
          active: true,
          createdAt: serverTimestamp()
        },
        {
          name: 'Coğrafya',
          description: 'Dünya üzerindeki yerler ve landmark\'lar',
          iconName: 'globe',
          color: '#10B981', // emerald-500
          backgroundColor: '#ECFDF5', // emerald-50
          active: true,
          createdAt: serverTimestamp()
        },
        {
          name: 'Film & TV',
          description: 'Filmler, TV şovları ve karakterler',
          iconName: 'film',
          color: '#6366F1', // indigo-500
          backgroundColor: '#EEF2FF', // indigo-50
          active: true,
          createdAt: serverTimestamp()
        },
        {
          name: 'Sanat',
          description: 'Ünlü sanat eserleri ve sanatçılar',
          iconName: 'palette',
          color: '#EC4899', // pink-500
          backgroundColor: '#FDF2F8', // pink-50
          active: true,
          createdAt: serverTimestamp()
        },
        {
          name: 'Oyunlar',
          description: 'Video oyunları ve karakterleri',
          iconName: 'gamepad',
          color: '#8B5CF6', // violet-500
          backgroundColor: '#F5F3FF', // violet-50
          active: true,
          createdAt: serverTimestamp()
        },
        {
          name: 'Müzik',
          description: 'Müzisyenler, şarkılar ve albümler',
          iconName: 'music',
          color: '#F59E0B', // amber-500
          backgroundColor: '#FFFBEB', // amber-50
          active: true,
          createdAt: serverTimestamp()
        },
        {
          name: 'Spor',
          description: 'Spor takımları, sporcular ve etkinlikler',
          iconName: 'trophy',
          color: '#059669', // emerald-600
          backgroundColor: '#ECFDF5', // emerald-50
          active: true,
          createdAt: serverTimestamp()
        },
        {
          name: 'Teknoloji',
          description: 'Teknolojik ürünler ve markalar',
          iconName: 'cpu',
          color: '#3B82F6', // blue-500
          backgroundColor: '#EFF6FF', // blue-50
          active: true,
          createdAt: serverTimestamp()
        }
      ];
      
      for (const category of categoriesData) {
        const docRef = await addDoc(collection(db, 'categories'), category);
        console.log(`Added category: ${category.name} with ID: ${docRef.id}`);
        categoryRefs[category.name] = docRef.id;
      }
    } else {
      // Get existing categories
      categoriesSnapshot.forEach(doc => {
        const data = doc.data();
        categoryRefs[data.name] = doc.id;
      });
      console.log('Categories already exist, using existing categories');
    }
    
    // Check if images already exist
    const imagesRef = collection(db, 'images');
    const imagesSnapshot = await getDocs(imagesRef);
    
    if (imagesSnapshot.empty) {
      // Add images
      console.log('Adding images...');
      const imagesData = [
        {
          title: 'Ferrari 458',
          imageUrl: '/attached_assets/ba1f50f644077acc8bedb8b0634c1af8.jpg',
          categoryId: categoryRefs['Arabalar'],
          answers: ['Ferrari', 'Ferrari 458', '458 Italia'],
          difficulty: 2,
          playCount: 120,
          likeCount: 45,
          active: true,
          createdAt: serverTimestamp()
        },
        {
          title: 'İstanbul Boğazı',
          imageUrl: '/attached_assets/86b4065a7c34a1c78de57b71078b4f5b.jpg',
          categoryId: categoryRefs['Coğrafya'],
          answers: ['İstanbul', 'Istanbul', 'Boğaz', 'Bogazici', 'Bosphorus'],
          difficulty: 1,
          playCount: 200,
          likeCount: 78,
          active: true,
          createdAt: serverTimestamp()
        },
        {
          title: 'Star Wars - Darth Vader',
          imageUrl: '/attached_assets/6c161a984b072640f8d7cde4b759f0a8.jpg',
          categoryId: categoryRefs['Film & TV'],
          answers: ['Star Wars', 'Darth Vader', 'Vader'],
          difficulty: 2,
          playCount: 180,
          likeCount: 95,
          active: true,
          createdAt: serverTimestamp()
        }
      ];
      
      const imageRefs = {};
      
      for (const image of imagesData) {
        const docRef = await addDoc(collection(db, 'images'), image);
        console.log(`Added image: ${image.title} with ID: ${docRef.id}`);
        imageRefs[image.title] = docRef.id;
      }
    }
    
    // Check if tests already exist
    const testsRef = collection(db, 'tests');
    const testsSnapshot = await getDocs(testsRef);
    
    if (testsSnapshot.empty) {
      // Add tests
      console.log('Adding tests...');
      const testsData = [
        {
          uuid: createId(),
          title: 'Arabalar Testi',
          description: 'Otomobil markaları ve modelleri hakkında bilginizi test edin',
          creatorId: null,
          categoryId: categoryRefs['Arabalar'],
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
          createdAt: serverTimestamp()
        },
        {
          uuid: createId(),
          title: 'Dünya Coğrafyası',
          description: 'Dünya üzerindeki önemli yerleri tanıyabilecek misiniz?',
          creatorId: null,
          categoryId: categoryRefs['Coğrafya'],
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
          createdAt: serverTimestamp()
        },
        {
          uuid: createId(),
          title: 'Film Karakterleri',
          description: 'Popüler film karakterlerini tanıyabilecek misiniz?',
          creatorId: null,
          categoryId: categoryRefs['Film & TV'],
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
          createdAt: serverTimestamp()
        }
      ];
      
      for (const test of testsData) {
        const docRef = await addDoc(collection(db, 'tests'), test);
        console.log(`Added test: ${test.title} with ID: ${docRef.id}`);
      }
    }
    
    console.log('✅ All sample data added successfully to Firestore!');
  } catch (error) {
    console.error('Error seeding Firestore database:', error);
  }
}

// Run the seed function
seedData();