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
          imageUrl: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=800',
          categoryId: categoryRefs['Arabalar'] || Object.values(categoryRefs)[0],
          answers: ['Ferrari', 'Ferrari 458', '458 Italia'],
          difficulty: 2,
          playCount: 120,
          likeCount: 45,
          active: true,
          createdAt: serverTimestamp()
        },
        {
          title: 'İstanbul Boğazı',
          imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
          categoryId: categoryRefs['Coğrafya'] || Object.values(categoryRefs)[1],
          answers: ['İstanbul', 'Istanbul', 'Boğaz', 'Bogazici', 'Bosphorus'],
          difficulty: 1,
          playCount: 200,
          likeCount: 78,
          active: true,
          createdAt: serverTimestamp()
        },
        {
          title: 'Star Wars - Darth Vader',
          imageUrl: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=800',
          categoryId: categoryRefs['Film & TV'] || Object.values(categoryRefs)[2],
          answers: ['Star Wars', 'Darth Vader', 'Vader'],
          difficulty: 2,
          playCount: 180,
          likeCount: 95,
          active: true,
          createdAt: serverTimestamp()
        },
        {
          title: 'Mona Lisa',
          imageUrl: 'https://images.unsplash.com/photo-1423742774270-6884aac775fa?w=800',
          categoryId: categoryRefs['Sanat'] || Object.values(categoryRefs)[3],
          answers: ['Mona Lisa', 'Leonardo da Vinci', 'da Vinci'],
          difficulty: 1,
          playCount: 150,
          likeCount: 67,
          active: true,
          createdAt: serverTimestamp()
        },
        {
          title: 'Minecraft',
          imageUrl: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800',
          categoryId: categoryRefs['Oyunlar'] || Object.values(categoryRefs)[4],
          answers: ['Minecraft', 'Mine Craft'],
          difficulty: 1,
          playCount: 250,
          likeCount: 120,
          active: true,
          createdAt: serverTimestamp()
        },
        {
          title: 'Lamborghini Aventador',
          imageUrl: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800',
          categoryId: categoryRefs['Arabalar'] || Object.values(categoryRefs)[0],
          answers: ['Lamborghini', 'Lamborghini Aventador', 'Aventador'],
          difficulty: 2,
          playCount: 180,
          likeCount: 95,
          active: true,
          createdAt: serverTimestamp()
        },
        {
          title: 'Eyfel Kulesi',
          imageUrl: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800',
          categoryId: categoryRefs['Coğrafya'] || Object.values(categoryRefs)[1],
          answers: ['Eyfel Kulesi', 'Eiffel Tower', 'Paris'],
          difficulty: 1,
          playCount: 220,
          likeCount: 110,
          active: true,
          createdAt: serverTimestamp()
        },
        {
          title: 'Harry Potter',
          imageUrl: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=800',
          categoryId: categoryRefs['Film & TV'] || Object.values(categoryRefs)[2],
          answers: ['Harry Potter', 'Hogwarts'],
          difficulty: 1,
          playCount: 240,
          likeCount: 130,
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
    } else {
      console.log(`Found ${imagesSnapshot.size} existing images, skipping image creation`);
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
          categoryId: categoryRefs['Arabalar'] || Object.values(categoryRefs)[0],
          questions: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=800',
              answers: ['Ferrari', 'Ferrari 458', '458 Italia'],
              question: 'Bu görselde ne görüyorsunuz?'
            },
            {
              imageUrl: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800',
              answers: ['Lamborghini', 'Lamborghini Aventador', 'Aventador'],
              question: 'Bu araba hangi markaya ait?'
            }
          ],
          thumbnailUrl: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=800',
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
          categoryId: categoryRefs['Coğrafya'] || Object.values(categoryRefs)[1],
          questions: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
              answers: ['İstanbul', 'Istanbul', 'Boğaz', 'Bogazici', 'Bosphorus'],
              question: 'Bu görselde hangi şehir görünüyor?'
            },
            {
              imageUrl: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800',
              answers: ['Eyfel Kulesi', 'Eiffel Tower', 'Paris'],
              question: 'Bu ünlü yapı nedir?'
            }
          ],
          thumbnailUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
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
          categoryId: categoryRefs['Film & TV'] || Object.values(categoryRefs)[2],
          questions: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=800',
              answers: ['Star Wars', 'Darth Vader', 'Vader'],
              question: 'Bu görselde hangi film karakteri görünüyor?'
            },
            {
              imageUrl: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=800',
              answers: ['Harry Potter', 'Hogwarts'],
              question: 'Bu hangi film serisine ait?'
            }
          ],
          thumbnailUrl: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=800',
          playCount: 65,
          likeCount: 30,
          isPublic: true,
          isAnonymous: false,
          approved: true,
          featured: true,
          difficulty: 2,
          createdAt: serverTimestamp()
        },
        {
          uuid: createId(),
          title: 'Sanat Eserleri',
          description: 'Ünlü sanat eserlerini tanıyabilecek misiniz?',
          creatorId: null,
          categoryId: categoryRefs['Sanat'] || Object.values(categoryRefs)[3],
          questions: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1423742774270-6884aac775fa?w=800',
              answers: ['Mona Lisa', 'Leonardo da Vinci', 'da Vinci'],
              question: 'Bu ünlü tablo nedir?'
            }
          ],
          thumbnailUrl: 'https://images.unsplash.com/photo-1423742774270-6884aac775fa?w=800',
          playCount: 42,
          likeCount: 18,
          isPublic: true,
          isAnonymous: false,
          approved: true,
          featured: true,
          difficulty: 1,
          createdAt: serverTimestamp()
        },
        {
          uuid: createId(),
          title: 'Video Oyunları',
          description: 'Popüler video oyunlarını tanıyabilecek misiniz?',
          creatorId: null,
          categoryId: categoryRefs['Oyunlar'] || Object.values(categoryRefs)[4],
          questions: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800',
              answers: ['Minecraft', 'Mine Craft'],
              question: 'Bu hangi oyun?'
            }
          ],
          thumbnailUrl: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800',
          playCount: 65,
          likeCount: 30,
          isPublic: true,
          isAnonymous: false,
          approved: true,
          featured: false,
          difficulty: 1,
          createdAt: serverTimestamp()
        }
      ];
      
      for (const test of testsData) {
        const docRef = await addDoc(collection(db, 'tests'), test);
        console.log(`Added test: ${test.title} with ID: ${docRef.id}`);
      }
    } else {
      console.log(`Found ${testsSnapshot.size} existing tests, skipping test creation`);
    }
    
    console.log('✅ All sample data added successfully to Firestore!');
  } catch (error) {
    console.error('Error seeding Firestore database:', error);
  }
}

// Run the seed function
seedData();