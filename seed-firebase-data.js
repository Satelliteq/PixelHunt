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
    
    if (!categoriesSnapshot.empty) {
      console.log('Categories already exist. Checking if we need to add more sample data...');
    } else {
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
      
      const categoryRefs = {};
      
      for (const category of categoriesData) {
        const docRef = await addDoc(collection(db, 'categories'), category);
        console.log(`Added category: ${category.name} with ID: ${docRef.id}`);
        categoryRefs[category.name] = docRef.id;
      }
    }
    
    // Get all categories for reference
    const allCategoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categoryRefs = {};
    allCategoriesSnapshot.forEach(doc => {
      const data = doc.data();
      categoryRefs[data.name] = doc.id;
    });
    
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
    
    // Add more sample images
    console.log('Adding additional sample images...');
    const additionalImagesData = [
      {
        title: 'Mona Lisa',
        imageUrl: 'https://images.unsplash.com/photo-1544333323-ec9ed3218dd1?w=500',
        categoryId: categoryRefs['Sanat'],
        answers: ['Mona Lisa', 'Leonardo da Vinci', 'La Gioconda'],
        difficulty: 1,
        playCount: 150,
        likeCount: 60,
        active: true,
        createdAt: serverTimestamp()
      },
      {
        title: 'Minecraft',
        imageUrl: 'https://images.unsplash.com/photo-1587573089734-599851b2c3b1?w=500',
        categoryId: categoryRefs['Oyunlar'],
        answers: ['Minecraft', 'Mine Craft'],
        difficulty: 1,
        playCount: 220,
        likeCount: 110,
        active: true,
        createdAt: serverTimestamp()
      },
      {
        title: 'Beatles',
        imageUrl: 'https://images.unsplash.com/photo-1516981879613-9f5da904015f?w=500',
        categoryId: categoryRefs['Müzik'],
        answers: ['Beatles', 'The Beatles', 'Beatles Band'],
        difficulty: 2,
        playCount: 180,
        likeCount: 85,
        active: true,
        createdAt: serverTimestamp()
      },
      {
        title: 'Futbol',
        imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?w=500',
        categoryId: categoryRefs['Spor'],
        answers: ['Futbol', 'Football', 'Soccer'],
        difficulty: 1,
        playCount: 160,
        likeCount: 70,
        active: true,
        createdAt: serverTimestamp()
      },
      {
        title: 'iPhone',
        imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500',
        categoryId: categoryRefs['Teknoloji'],
        answers: ['iPhone', 'Apple', 'Smartphone'],
        difficulty: 1,
        playCount: 190,
        likeCount: 80,
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
    
    // Add more sample tests
    console.log('Adding additional sample tests...');
    const additionalTestsData = [
      {
        uuid: createId(),
        title: 'Sanat Eserleri Testi',
        description: 'Ünlü sanat eserlerini tanıyabilecek misiniz?',
        creatorId: null,
        categoryId: categoryRefs['Sanat'],
        questions: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1544333323-ec9ed3218dd1?w=500',
            answers: ['Mona Lisa', 'Leonardo da Vinci', 'La Gioconda'],
            question: 'Bu ünlü tablo nedir?'
          }
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1544333323-ec9ed3218dd1?w=500',
        playCount: 40,
        likeCount: 18,
        isPublic: true,
        isAnonymous: false,
        approved: true,
        featured: false,
        difficulty: 1,
        createdAt: serverTimestamp()
      },
      {
        uuid: createId(),
        title: 'Video Oyunları Testi',
        description: 'Popüler video oyunlarını tanıyabilecek misiniz?',
        creatorId: null,
        categoryId: categoryRefs['Oyunlar'],
        questions: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1587573089734-599851b2c3b1?w=500',
            answers: ['Minecraft', 'Mine Craft'],
            question: 'Bu hangi oyun?'
          }
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1587573089734-599851b2c3b1?w=500',
        playCount: 55,
        likeCount: 25,
        isPublic: true,
        isAnonymous: false,
        approved: true,
        featured: true,
        difficulty: 1,
        createdAt: serverTimestamp()
      },
      {
        uuid: createId(),
        title: 'Müzik Dünyası Testi',
        description: 'Ünlü müzisyenleri ve grupları tanıyabilecek misiniz?',
        creatorId: null,
        categoryId: categoryRefs['Müzik'],
        questions: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1516981879613-9f5da904015f?w=500',
            answers: ['Beatles', 'The Beatles', 'Beatles Band'],
            question: 'Bu ünlü müzik grubu hangisidir?'
          }
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1516981879613-9f5da904015f?w=500',
        playCount: 45,
        likeCount: 22,
        isPublic: true,
        isAnonymous: false,
        approved: true,
        featured: false,
        difficulty: 2,
        createdAt: serverTimestamp()
      },
      {
        uuid: createId(),
        title: 'Spor Dünyası Testi',
        description: 'Spor dünyasındaki bilginizi test edin',
        creatorId: null,
        categoryId: categoryRefs['Spor'],
        questions: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?w=500',
            answers: ['Futbol', 'Football', 'Soccer'],
            question: 'Bu hangi spor?'
          }
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?w=500',
        playCount: 38,
        likeCount: 16,
        isPublic: true,
        isAnonymous: false,
        approved: true,
        featured: false,
        difficulty: 1,
        createdAt: serverTimestamp()
      },
      {
        uuid: createId(),
        title: 'Teknoloji Markaları Testi',
        description: 'Teknoloji dünyasındaki markaları tanıyabilecek misiniz?',
        creatorId: null,
        categoryId: categoryRefs['Teknoloji'],
        questions: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500',
            answers: ['iPhone', 'Apple', 'Smartphone'],
            question: 'Bu hangi teknolojik ürün?'
          }
        ],
        thumbnailUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500',
        playCount: 42,
        likeCount: 20,
        isPublic: true,
        isAnonymous: false,
        approved: true,
        featured: true,
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
    
    console.log('✅ All sample data added successfully to Firestore!');
  } catch (error) {
    console.error('Error seeding Firestore database:', error);
  }
}

// Run the seed function
seedData();