import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  increment, 
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  FirestoreDataConverter,
  Query
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createId } from '@paralleldrive/cuid2';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBtHxrkA9kcUQZyJp9bA48Evyt5U-7AVoQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pixelhunt-7afa8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pixelhunt-7afa8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pixelhunt-7afa8.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "595531085941",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:595531085941:web:9bd7b5f890098211d2a03c",
  databaseURL: "https://pixelhunt-7afa8-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);

export { app, auth, db, storage, rtdb };

// Type definitions
export interface User {
  uid: string;
  username: string;
  email: string;
  role: string;
  score: number;
  avatarUrl?: string;
  banned: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  iconName?: string;
  color?: string;
  backgroundColor?: string;
  active: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Image {
  id: string;
  title: string;
  imageUrl: string;
  storageRef?: string;
  categoryId: string;
  answers: string[];
  hints?: string[];
  difficulty: number;
  playCount: number;
  likeCount: number;
  active: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Question {
  id?: string;
  question: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: number;
}

export interface Test {
  id: string;
  uuid: string;
  title: string;
  description: string;
  creatorId?: string;
  categoryId?: string;
  questions: Question[];
  thumbnailUrl?: string;
  playCount: number;
  likeCount: number;
  isPublic: boolean;
  isAnonymous: boolean;
  approved: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TestComment {
  id: string;
  testId: string;
  userId: string;
  comment: string;
  createdAt: Date;
}

export interface GameScore {
  id: string;
  userId?: string;
  testId?: string;
  gameMode: string;
  score: number;
  completionTime?: number;
  attemptsCount: number;
  completed: boolean;
  details?: any;
  createdAt: Date;
}

export interface UserActivity {
  id: string;
  userId: string;
  userName?: string;
  activityType: string;
  details?: string;
  entityId?: string;
  entityType?: string;
  metadata?: any;
  createdAt: Date;
}

// Helper functions for Firebase operations

// Initialize sample data for testing
export async function initializeSampleData() {
  try {
    // Check if we already have data
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    if (!categoriesSnapshot.empty) {
      console.log('Sample data already exists');
      return;
    }

    // Add sample categories
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
        description: 'Tablolar, heykeller ve diğer sanat eserleriyle ilgili testler',
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
      }
    ];

    for (const category of categoriesData) {
      await addDoc(collection(db, 'categories'), category);
    }

    // Add sample images
    const imagesData = [
      {
        title: 'Ferrari 458',
        imageUrl: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=800',
        categoryId: '1', // Will be updated after categories are created
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
        categoryId: '2', // Will be updated after categories are created
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
        categoryId: '3', // Will be updated after categories are created
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
        categoryId: '4', // Will be updated after categories are created
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
        categoryId: '5', // Will be updated after categories are created
        answers: ['Minecraft', 'Mine Craft'],
        difficulty: 1,
        playCount: 250,
        likeCount: 120,
        active: true,
        createdAt: serverTimestamp()
      }
    ];

    // Get actual category IDs
    const categoriesQuery = await getDocs(collection(db, 'categories'));
    const categoryIds: Record<string, string> = {};
    let index = 1;
    categoriesQuery.forEach(doc => {
      categoryIds[index.toString()] = doc.id;
      index++;
    });

    // Add images with correct category IDs
    for (const image of imagesData) {
      const categoryId = categoryIds[image.categoryId];
      if (categoryId) {
        image.categoryId = categoryId;
        await addDoc(collection(db, 'images'), image);
      }
    }

    // Add sample tests
    const testsData = [
      {
        uuid: createId(),
        title: 'Arabalar Testi',
        description: 'Otomobil markaları ve modelleri hakkında bilginizi test edin',
        creatorId: null,
        categoryId: categoryIds['1'] || Object.values(categoryIds)[0],
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
        createdAt: serverTimestamp()
      },
      {
        uuid: createId(),
        title: 'Dünya Coğrafyası',
        description: 'Dünya üzerindeki önemli yerleri tanıyabilecek misiniz?',
        creatorId: null,
        categoryId: categoryIds['2'] || Object.values(categoryIds)[1],
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
        categoryId: categoryIds['3'] || Object.values(categoryIds)[2],
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
        categoryId: categoryIds['4'] || Object.values(categoryIds)[3],
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
        categoryId: categoryIds['5'] || Object.values(categoryIds)[4],
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
      await addDoc(collection(db, 'tests'), test);
    }

    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error;
  }
}

// Categories
export async function getAllCategories(): Promise<Category[]> {
  try {
    // Base query
    const categoriesRef = collection(db, 'categories');
    const q = query(
      categoriesRef, 
      where('active', '==', true), 
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description || '',
        iconName: data.iconName,
        color: data.color,
        backgroundColor: data.backgroundColor,
        active: data.active !== false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate()
      };
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getCategory(id: string): Promise<Category | null> {
  try {
    const docRef = doc(db, 'categories', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description || '',
        iconName: data.iconName,
        color: data.color,
        backgroundColor: data.backgroundColor,
        active: data.active !== false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    return null;
  }
}

// Images
export async function getImage(id: string): Promise<Image | null> {
  try {
    const docRef = doc(db, 'images', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        imageUrl: data.imageUrl,
        storageRef: data.storageRef,
        categoryId: data.categoryId,
        answers: data.answers || [],
        hints: data.hints || [],
        difficulty: data.difficulty || 1,
        playCount: data.playCount || 0,
        likeCount: data.likeCount || 0,
        active: data.active !== false,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching image ${id}:`, error);
    return null;
  }
}

export async function getImagesByCategory(categoryId: string): Promise<Image[]> {
  try {
    const imagesRef = collection(db, 'images');
    const q = query(
      imagesRef, 
      where('categoryId', '==', categoryId),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        imageUrl: data.imageUrl,
        storageRef: data.storageRef,
        categoryId: data.categoryId,
        answers: data.answers || [],
        hints: data.hints || [],
        difficulty: data.difficulty || 1,
        playCount: data.playCount || 0,
        likeCount: data.likeCount || 0,
        active: data.active !== false,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate()
      };
    });
  } catch (error) {
    console.error(`Error fetching images for category ${categoryId}:`, error);
    return [];
  }
}

export async function getRandomImage(categoryId?: string): Promise<Image | null> {
  try {
    const imagesRef = collection(db, 'images');
    let q;
    
    if (categoryId) {
      q = query(
        imagesRef,
        where('categoryId', '==', categoryId),
        where('active', '==', true),
        limit(20) // Get a sample of images
      );
    } else {
      q = query(
        imagesRef,
        where('active', '==', true),
        limit(20) // Get a sample of images
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Select a random image from the results
    const randomIndex = Math.floor(Math.random() * querySnapshot.docs.length);
    const randomDoc = querySnapshot.docs[randomIndex];
    const data = randomDoc.data();
    
    return {
      id: randomDoc.id,
      title: data.title,
      imageUrl: data.imageUrl,
      storageRef: data.storageRef,
      categoryId: data.categoryId,
      answers: data.answers || [],
      hints: data.hints || [],
      difficulty: data.difficulty || 1,
      playCount: data.playCount || 0,
      likeCount: data.likeCount || 0,
      active: data.active !== false,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate()
    };
  } catch (error) {
    console.error('Error fetching random image:', error);
    return null;
  }
}

export async function incrementImagePlayCount(id: string): Promise<void> {
  try {
    const imageRef = doc(db, 'images', id);
    await updateDoc(imageRef, {
      playCount: increment(1)
    });
  } catch (error) {
    console.error(`Error incrementing play count for image ${id}:`, error);
  }
}

export async function incrementImageLikeCount(id: string): Promise<void> {
  try {
    const imageRef = doc(db, 'images', id);
    await updateDoc(imageRef, {
      likeCount: increment(1)
    });
  } catch (error) {
    console.error(`Error incrementing like count for image ${id}:`, error);
  }
}

// Tests
export async function getAllTests(): Promise<Test[]> {
  try {
    // Base query
    const testsRef = collection(db, 'tests');
    const q = query(
      testsRef,
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log("Test sayısı:", querySnapshot.docs.length);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log("Test verisi:", data);
      
      return {
        id: doc.id,
        uuid: data.uuid || createId(),
        title: data.title,
        description: data.description || '',
        creatorId: data.creatorId,
        categoryId: data.categoryId,
        questions: data.questions || [],
        thumbnailUrl: data.thumbnailUrl || getDefaultThumbnail(),
        playCount: data.playCount || 0,
        likeCount: data.likeCount || 0,
        isPublic: data.isPublic !== false,
        isAnonymous: data.isAnonymous === true,
        approved: data.approved === true,
        featured: data.featured === true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate()
      };
    });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return [];
  }
}

export async function getTest(id: string): Promise<Test | null> {
  try {
    const docRef = doc(db, 'tests', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        uuid: data.uuid,
        title: data.title,
        description: data.description || '',
        creatorId: data.creatorId,
        categoryId: data.categoryId,
        questions: data.questions || [],
        thumbnailUrl: data.thumbnailUrl || getDefaultThumbnail(),
        playCount: data.playCount || 0,
        likeCount: data.likeCount || 0,
        isPublic: data.isPublic !== false,
        isAnonymous: data.isAnonymous === true,
        approved: data.approved === true,
        featured: data.featured === true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching test ${id}:`, error);
    return null;
  }
}

export async function getTestByUuid(uuid: string): Promise<Test | null> {
  try {
    const testsRef = collection(db, 'tests');
    const q = query(testsRef, where('uuid', '==', uuid), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        uuid: data.uuid,
        title: data.title,
        description: data.description || '',
        creatorId: data.creatorId,
        categoryId: data.categoryId,
        questions: data.questions || [],
        thumbnailUrl: data.thumbnailUrl || getDefaultThumbnail(),
        playCount: data.playCount || 0,
        likeCount: data.likeCount || 0,
        isPublic: data.isPublic !== false,
        isAnonymous: data.isAnonymous === true,
        approved: data.approved === true,
        featured: data.featured === true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching test by UUID ${uuid}:`, error);
    return null;
  }
}

export async function getTestsByCategory(categoryId: string): Promise<Test[]> {
  try {
    const testsRef = collection(db, 'tests');
    const q = query(
      testsRef,
      where('categoryId', '==', categoryId),
      where('isPublic', '==', true),
      where('approved', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uuid: data.uuid,
        title: data.title,
        description: data.description || '',
        creatorId: data.creatorId,
        categoryId: data.categoryId,
        questions: data.questions || [],
        thumbnailUrl: data.thumbnailUrl || getDefaultThumbnail(),
        playCount: data.playCount || 0,
        likeCount: data.likeCount || 0,
        isPublic: data.isPublic !== false,
        isAnonymous: data.isAnonymous === true,
        approved: data.approved === true,
        featured: data.featured === true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate()
      };
    });
  } catch (error) {
    console.error(`Error fetching tests for category ${categoryId}:`, error);
    return [];
  }
}

export async function createTest(testData: any): Promise<Test> {
  try {
    // Test verilerini hazırla
    const newTest = {
      ...testData,
      uuid: createId(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      playCount: 0,
      likeCount: 0,
      approved: true,
      featured: false
    };
    
    // Firestore'a ekle
    const docRef = await addDoc(collection(db, 'tests'), newTest);
    
    // Oluşturulan testi döndür
    return {
      id: docRef.id,
      ...newTest,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error("Test oluşturma hatası:", error);
    throw new Error('Test oluşturulamadı');
  }
}

export async function incrementTestPlayCount(id: string): Promise<void> {
  try {
    const testRef = doc(db, 'tests', id);
    await updateDoc(testRef, {
      playCount: increment(1),
      lastPlayedAt: serverTimestamp()
    });

    // Oyun aktivitesini kaydet
    await addDoc(collection(db, 'userActivities'), {
      activityType: 'play_test',
      entityId: id,
      entityType: 'test',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error incrementing play count for test ${id}:`, error);
  }
}

export async function incrementTestLikeCount(id: string): Promise<void> {
  try {
    const testRef = doc(db, 'tests', id);
    await updateDoc(testRef, {
      likeCount: increment(1)
    });
  } catch (error) {
    console.error(`Error incrementing like count for test ${id}:`, error);
  }
}

export async function getPopularTests(limitCount: number = 5): Promise<Test[]> {
  try {
    const testsRef = collection(db, 'tests');
    const q = query(
      testsRef,
      where('isPublic', '==', true),
      where('approved', '==', true),
      orderBy('playCount', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uuid: data.uuid,
        title: data.title,
        description: data.description || '',
        creatorId: data.creatorId,
        categoryId: data.categoryId,
        questions: data.questions || [],
        thumbnailUrl: data.thumbnailUrl || getDefaultThumbnail(),
        playCount: data.playCount || 0,
        likeCount: data.likeCount || 0,
        isPublic: data.isPublic !== false,
        isAnonymous: data.isAnonymous === true,
        approved: data.approved === true,
        featured: data.featured === true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate()
      };
    });
  } catch (error) {
    console.error('Error fetching popular tests:', error);
    return [];
  }
}

export async function getNewestTests(limitCount: number = 5): Promise<Test[]> {
  try {
    const testsRef = collection(db, 'tests');
    const q = query(
      testsRef,
      where('isPublic', '==', true),
      where('approved', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uuid: data.uuid,
        title: data.title,
        description: data.description || '',
        creatorId: data.creatorId,
        categoryId: data.categoryId,
        questions: data.questions || [],
        thumbnailUrl: data.thumbnailUrl || getDefaultThumbnail(),
        playCount: data.playCount || 0,
        likeCount: data.likeCount || 0,
        isPublic: data.isPublic !== false,
        isAnonymous: data.isAnonymous === true,
        approved: data.approved === true,
        featured: data.featured === true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate()
      };
    });
  } catch (error) {
    console.error('Error fetching newest tests:', error);
    return [];
  }
}

export async function getFeaturedTests(limitCount: number = 5): Promise<Test[]> {
  try {
    const testsRef = collection(db, 'tests');
    const q = query(
      testsRef,
      where('isPublic', '==', true),
      where('approved', '==', true),
      where('featured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uuid: data.uuid,
        title: data.title,
        description: data.description || '',
        creatorId: data.creatorId,
        categoryId: data.categoryId,
        questions: data.questions || [],
        thumbnailUrl: data.thumbnailUrl || getDefaultThumbnail(),
        playCount: data.playCount || 0,
        likeCount: data.likeCount || 0,
        isPublic: data.isPublic !== false,
        isAnonymous: data.isAnonymous === true,
        approved: data.approved === true,
        featured: data.featured === true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate()
      };
    });
  } catch (error) {
    console.error('Error fetching featured tests:', error);
    return [];
  }
}

// Search function
export async function searchTests(searchQuery: string, categoryId?: string): Promise<Test[]> {
  try {
    // Base query
    const testsRef = collection(db, 'tests');
    const baseQuery = query(
      testsRef,
      where('isPublic', '==', true),
      where('approved', '==', true),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    // Execute query
    const querySnapshot = await getDocs(baseQuery);
    
    // Filter results client-side for text search
    let results = querySnapshot.docs.map(doc => {
      const data = doc.data() as {
        uuid: string;
        title: string;
        description?: string;
        creatorId?: string;
        categoryId?: string;
        questions: any[];
        thumbnailUrl?: string;
        playCount?: number;
        likeCount?: number;
        isPublic?: boolean;
        isAnonymous?: boolean;
        approved?: boolean;
        featured?: boolean;
        createdAt?: any;
        updatedAt?: any;
      };
      
      return {
        id: doc.id,
        uuid: data.uuid,
        title: data.title,
        description: data.description || '',
        creatorId: data.creatorId,
        categoryId: data.categoryId,
        questions: data.questions || [],
        thumbnailUrl: data.thumbnailUrl || getDefaultThumbnail(),
        playCount: data.playCount || 0,
        likeCount: data.likeCount || 0,
        isPublic: data.isPublic !== false,
        isAnonymous: data.isAnonymous === true,
        approved: data.approved === true,
        featured: data.featured === true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate()
      };
    });
    
    // Filter by search query if provided
    if (searchQuery && searchQuery.trim() !== '') {
      const normalizedQuery = searchQuery.toLowerCase().trim();
      results = results.filter(test => 
        test.title.toLowerCase().includes(normalizedQuery) || 
        (test.description && test.description.toLowerCase().includes(normalizedQuery))
      );
    }
    
    // Filter by category if provided
    if (categoryId) {
      results = results.filter(test => test.categoryId === categoryId);
    }
    
    return results;
  } catch (error) {
    console.error('Error searching tests:', error);
    return [];
  }
}

// Görsel yükleme yardımcı fonksiyonu
export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Dosya boyutu 5MB\'dan küçük olmalıdır');
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      throw new Error('Sadece görsel dosyaları yüklenebilir');
    }

    // Storage referansı oluştur
    const storageRef = ref(storage, `${path}/${createId()}_${file.name}`);
    
    // Dosyayı yükle
    const snapshot = await uploadBytes(storageRef, file);
    
    // İndirme URL'sini al
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    throw new Error('Dosya yüklenemedi');
  }
}

// Game functions
export async function checkAnswer(imageId: string, answer: string): Promise<boolean> {
  try {
    const image = await getImage(imageId);
    
    if (!image) {
      throw new Error('Image not found');
    }
    
    const normalizedAnswer = answer.trim().toLowerCase();
    const isCorrect = image.answers.some(a => 
      a.toLowerCase() === normalizedAnswer
    );
    
    return isCorrect;
  } catch (error) {
    console.error('Error checking answer:', error);
    return false;
  }
}

export async function saveGameScore(scoreData: Omit<GameScore, 'id' | 'createdAt'>): Promise<GameScore> {
  try {
    // Prepare score data
    const newScore = {
      ...scoreData,
      createdAt: serverTimestamp()
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'gameScores'), newScore);
    
    // Update user score if userId is provided
    if (scoreData.userId) {
      const userRef = doc(db, 'users', scoreData.userId);
      await updateDoc(userRef, {
        score: increment(scoreData.score)
      });
      
      // Record activity
      await addDoc(collection(db, 'userActivities'), {
        userId: scoreData.userId,
        activityType: 'game_score',
        details: `Oyun skoru: ${scoreData.score} puan, mod: ${scoreData.gameMode}`,
        entityType: 'game',
        createdAt: serverTimestamp()
      });
    }
    
    // Return the created score
    return {
      id: docRef.id,
      ...scoreData,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Error saving game score:', error);
    throw new Error('Game score saving failed');
  }
}

// Helper function to get a default thumbnail if none is provided
function getDefaultThumbnail(): string {
  const defaultThumbnails = [
    'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500',
    'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=500',
    'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=500',
    'https://images.unsplash.com/photo-1423742774270-6884aac775fa?w=500',
    'https://images.unsplash.com/photo-1627853202273-797f1c22a38e?w=500'
  ];
  
  return defaultThumbnails[Math.floor(Math.random() * defaultThumbnails.length)];
}

// Test güncelleme
export const updateTest = async (test: any) => {
  try {
    const testRef = doc(db, "tests", test.id);
    await updateDoc(testRef, {
      title: test.title,
      description: test.description,
      categoryId: test.categoryId,
      thumbnailUrl: test.thumbnailUrl,
      questions: test.questions.map((q: any) => ({
        id: q.id,
        imageUrl: q.imageUrl,
        answers: q.answers,
        question: q.question
      })),
      isPublic: test.isPublic,
      isAnonymous: test.isAnonymous,
      approved: true,
      updatedAt: serverTimestamp()
    });
    return test;
  } catch (error) {
    console.error("Test güncelleme hatası:", error);
    throw error;
  }
};

// Test getirme
export async function getTestById(id: string): Promise<Test | null> {
  try {
    if (!id) {
      console.error("Test ID'si boş olamaz");
      return null;
    }

    const testRef = doc(db, "tests", id);
    const testSnap = await getDoc(testRef);
    
    if (!testSnap.exists()) {
      console.error("Test bulunamadı:", id);
      return null;
    }
    
    const data = testSnap.data();
    console.log("Test verileri:", data);
    
    // Test public değilse ve kullanıcı admin değilse null dön
    if (!data.isPublic && !data.approved) {
      console.error("Test erişilebilir değil:", id);
      return null;
    }
    
    return {
      id: testSnap.id,
      uuid: data.uuid || createId(),
      title: data.title,
      description: data.description || '',
      creatorId: data.creatorId,
      categoryId: data.categoryId,
      questions: data.questions || [],
      thumbnailUrl: data.thumbnailUrl || getDefaultThumbnail(),
      playCount: data.playCount || 0,
      likeCount: data.likeCount || 0,
      isPublic: data.isPublic !== false,
      isAnonymous: data.isAnonymous === true,
      approved: data.approved === true,
      featured: data.featured === true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate()
    };
  } catch (error) {
    console.error(`Test getirme hatası (${id}):`, error);
    return null;
  }
}

// Resim yükleme
export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, `${path}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Resim yükleme hatası:", error);
    throw error;
  }
};

// Benzer testleri getir
export async function getSimilarTests(testId: string, limitCount: number = 3): Promise<Test[]> {
  try {
    // Önce mevcut testi al
    const currentTest = await getTestById(testId);
    if (!currentTest) {
      console.log("Mevcut test bulunamadı:", testId);
      return [];
    }

    console.log("Mevcut test:", currentTest);

    // Aynı kategorideki diğer testleri getir
    const testsRef = collection(db, 'tests');
    const q = query(
      testsRef,
      where('categoryId', '==', currentTest.categoryId),
      where('isPublic', '==', true),
      where('approved', '==', true),
      orderBy('playCount', 'desc'),
      limit(limitCount + 1) // Mevcut testi de dahil etmek için +1
    );
    
    const querySnapshot = await getDocs(q);
    console.log("Benzer test sayısı:", querySnapshot.docs.length);
    
    // Mevcut testi hariç tut ve sonuçları döndür
    const similarTests = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        console.log("Test verisi:", data);
        
        return {
          id: doc.id,
          uuid: data.uuid || createId(),
          title: data.title,
          description: data.description || '',
          creatorId: data.creatorId,
          categoryId: data.categoryId,
          questions: data.questions || [],
          thumbnailUrl: data.thumbnailUrl || getDefaultThumbnail(),
          playCount: data.playCount || 0,
          likeCount: data.likeCount || 0,
          isPublic: data.isPublic !== false,
          isAnonymous: data.isAnonymous === true,
          approved: data.approved === true,
          featured: data.featured === true,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate()
        };
      })
      .filter(test => test.id !== testId) // Mevcut testi filtrele
      .slice(0, limitCount); // İstenen sayıda test döndür

    console.log("Filtrelenmiş benzer testler:", similarTests);
    return similarTests;
  } catch (error) {
    console.error('Error fetching similar tests:', error);
    return [];
  }
}

// Kullanıcı belgesini getir
export const fetchUserDocument = async (userId: string) => {
  if (!userId) {
    console.log('fetchUserDocument: userId boş');
    return null;
  }
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      console.log('Firestore kullanıcı verisi:', userData);
      
      const auth = getAuth();
      const currentUser = auth.currentUser;
      console.log('Auth kullanıcı verisi:', currentUser);
      
      // Avatar URL'sini kontrol et
      const avatarUrl = userData.avatarUrl || userData.photoURL || currentUser?.photoURL;
      console.log('Avatar URL:', avatarUrl);
      
      return {
        id: docSnap.id,
        uid: userId,
        displayName: userData.displayName || currentUser?.displayName || null,
        email: userData.email || currentUser?.email || null,
        avatarUrl: avatarUrl,
        username: userData.username || null,
        role: userData.role || 'user',
        score: userData.score || 0,
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate() || new Date()
      };
    } else {
      console.log('Kullanıcı belgesi bulunamadı:', userId);
      
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        console.log('Auth verilerini kullanıyoruz');
        return {
          id: userId,
          uid: userId,
          displayName: currentUser.displayName,
          email: currentUser.email,
          avatarUrl: currentUser.photoURL,
          username: currentUser.email?.split('@')[0] || null,
          role: 'user',
          score: 0,
          createdAt: new Date(),
          lastLoginAt: new Date()
        };
      }
      
      return null;
    }
  } catch (error) {
    console.error('Kullanıcı belgesi alınamadı:', error);
    return null;
  }
};