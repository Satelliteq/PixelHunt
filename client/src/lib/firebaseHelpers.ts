import { db, storage, rtdb } from './firebase';
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
  FirestoreDataConverter
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as rtdbRef, set, get, push, update, remove, query as rtdbQuery, orderByChild, limitToLast } from 'firebase/database';
import { createId } from '@paralleldrive/cuid2';

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
  imageUrl: string;
  answers: string[];
  question: string;
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
  difficulty: number;
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

// Firestore converters
const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    return {
      uid: user.uid,
      username: user.username,
      email: user.email,
      role: user.role,
      score: user.score,
      avatarUrl: user.avatarUrl,
      banned: user.banned,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): User {
    const data = snapshot.data();
    return {
      uid: data.uid,
      username: data.username,
      email: data.email,
      role: data.role || 'user',
      score: data.score || 0,
      avatarUrl: data.avatarUrl,
      banned: data.banned || false,
      lastLoginAt: data.lastLoginAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date()
    };
  }
};

const categoryConverter: FirestoreDataConverter<Category> = {
  toFirestore(category: Category): DocumentData {
    return {
      name: category.name,
      description: category.description,
      iconName: category.iconName,
      color: category.color,
      backgroundColor: category.backgroundColor,
      active: category.active,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Category {
    const data = snapshot.data();
    return {
      id: snapshot.id,
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
};

// Helper functions for Firebase operations

// Categories
export async function getAllCategories(): Promise<Category[]> {
  try {
    // First try to get from Firestore
    if (navigator.onLine) {
      const categoriesRef = collection(db, 'categories').withConverter(categoryConverter);
      const q = query(categoriesRef, where('active', '==', true), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data());
    }
    
    // If offline, try to get from Realtime Database
    const categoriesRef = rtdbRef(rtdb, 'categories');
    const snapshot = await get(categoriesRef);
    
    if (snapshot.exists()) {
      const categoriesData = snapshot.val();
      return Object.keys(categoriesData).map(key => ({
        id: key,
        ...categoriesData[key],
        createdAt: new Date(categoriesData[key].createdAt || Date.now()),
        updatedAt: categoriesData[key].updatedAt ? new Date(categoriesData[key].updatedAt) : undefined
      }));
    }
    
    // Return default categories if nothing is available
    return [
      {
        id: '1',
        name: 'Filmler',
        description: 'Film ve sinema dünyası',
        iconName: 'film',
        color: '#3B82F6',
        active: true,
        createdAt: new Date()
      },
      {
        id: '2',
        name: 'Sanat',
        description: 'Sanat eserleri ve sanatçılar',
        iconName: 'palette',
        color: '#EC4899',
        active: true,
        createdAt: new Date()
      },
      {
        id: '3',
        name: 'Coğrafya',
        description: 'Dünya üzerindeki yerler',
        iconName: 'globe',
        color: '#10B981',
        active: true,
        createdAt: new Date()
      },
      {
        id: '4',
        name: 'Oyunlar',
        description: 'Video oyunları ve karakterleri',
        iconName: 'gamepad',
        color: '#F59E0B',
        active: true,
        createdAt: new Date()
      },
      {
        id: '5',
        name: 'Müzik',
        description: 'Müzik dünyası ve sanatçılar',
        iconName: 'music',
        color: '#8B5CF6',
        active: true,
        createdAt: new Date()
      }
    ];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getCategory(id: string): Promise<Category | null> {
  try {
    // First try Firestore
    if (navigator.onLine) {
      const docRef = doc(db, 'categories', id).withConverter(categoryConverter);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
    }
    
    // If offline or not found in Firestore, try Realtime Database
    const categoryRef = rtdbRef(rtdb, `categories/${id}`);
    const snapshot = await get(categoryRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        id,
        ...data,
        createdAt: new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
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
    // Try Firestore first
    if (navigator.onLine) {
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
    }
    
    // Try Realtime Database
    const imageRef = rtdbRef(rtdb, `images/${id}`);
    const snapshot = await get(imageRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        id,
        ...data,
        createdAt: new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
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
    // Try Firestore first
    if (navigator.onLine) {
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
    }
    
    // Try Realtime Database
    const imagesRef = rtdbRef(rtdb, 'images');
    const imagesQuery = rtdbQuery(imagesRef, orderByChild('categoryId'));
    const snapshot = await get(imagesQuery);
    
    if (snapshot.exists()) {
      const imagesData = snapshot.val();
      const filteredImages = Object.keys(imagesData)
        .filter(key => imagesData[key].categoryId === categoryId && imagesData[key].active !== false)
        .map(key => ({
          id: key,
          ...imagesData[key],
          createdAt: new Date(imagesData[key].createdAt || Date.now()),
          updatedAt: imagesData[key].updatedAt ? new Date(imagesData[key].updatedAt) : undefined
        }));
      
      return filteredImages;
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching images for category ${categoryId}:`, error);
    return [];
  }
}

export async function getRandomImage(categoryId?: string): Promise<Image | null> {
  try {
    // Try Firestore first
    if (navigator.onLine) {
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
    }
    
    // Try Realtime Database
    const imagesRef = rtdbRef(rtdb, 'images');
    const snapshot = await get(imagesRef);
    
    if (snapshot.exists()) {
      const imagesData = snapshot.val();
      const imageKeys = Object.keys(imagesData);
      
      // Filter by category if needed
      const filteredKeys = categoryId 
        ? imageKeys.filter(key => imagesData[key].categoryId === categoryId && imagesData[key].active !== false)
        : imageKeys.filter(key => imagesData[key].active !== false);
      
      if (filteredKeys.length === 0) {
        return null;
      }
      
      // Select a random image
      const randomKey = filteredKeys[Math.floor(Math.random() * filteredKeys.length)];
      const randomImage = imagesData[randomKey];
      
      return {
        id: randomKey,
        ...randomImage,
        createdAt: new Date(randomImage.createdAt || Date.now()),
        updatedAt: randomImage.updatedAt ? new Date(randomImage.updatedAt) : undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching random image:', error);
    return null;
  }
}

export async function incrementImagePlayCount(id: string): Promise<void> {
  try {
    // Try Firestore first
    if (navigator.onLine) {
      const imageRef = doc(db, 'images', id);
      await updateDoc(imageRef, {
        playCount: increment(1)
      });
      return;
    }
    
    // Try Realtime Database
    const imageRef = rtdbRef(rtdb, `images/${id}`);
    const snapshot = await get(imageRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      await update(imageRef, {
        playCount: (data.playCount || 0) + 1
      });
    }
  } catch (error) {
    console.error(`Error incrementing play count for image ${id}:`, error);
  }
}

export async function incrementImageLikeCount(id: string): Promise<void> {
  try {
    // Try Firestore first
    if (navigator.onLine) {
      const imageRef = doc(db, 'images', id);
      await updateDoc(imageRef, {
        likeCount: increment(1)
      });
      return;
    }
    
    // Try Realtime Database
    const imageRef = rtdbRef(rtdb, `images/${id}`);
    const snapshot = await get(imageRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      await update(imageRef, {
        likeCount: (data.likeCount || 0) + 1
      });
    }
  } catch (error) {
    console.error(`Error incrementing like count for image ${id}:`, error);
  }
}

// Tests
export async function getAllTests(): Promise<Test[]> {
  try {
    // Try Firestore first
    if (navigator.onLine) {
      const testsRef = collection(db, 'tests');
      const q = query(
        testsRef,
        where('isPublic', '==', true),
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
          thumbnailUrl: data.thumbnailUrl,
          playCount: data.playCount || 0,
          likeCount: data.likeCount || 0,
          isPublic: data.isPublic !== false,
          isAnonymous: data.isAnonymous === true,
          approved: data.approved === true,
          featured: data.featured === true,
          difficulty: data.difficulty || 2,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate()
        };
      });
    }
    
    // Try Realtime Database
    const testsRef = rtdbRef(rtdb, 'tests');
    const snapshot = await get(testsRef);
    
    if (snapshot.exists()) {
      const testsData = snapshot.val();
      return Object.keys(testsData)
        .filter(key => testsData[key].isPublic !== false)
        .map(key => ({
          id: key,
          ...testsData[key],
          createdAt: new Date(testsData[key].createdAt || Date.now()),
          updatedAt: testsData[key].updatedAt ? new Date(testsData[key].updatedAt) : undefined
        }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching tests:', error);
    return [];
  }
}

export async function getTest(id: string): Promise<Test | null> {
  try {
    // Try Firestore first
    if (navigator.onLine) {
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
          thumbnailUrl: data.thumbnailUrl,
          playCount: data.playCount || 0,
          likeCount: data.likeCount || 0,
          isPublic: data.isPublic !== false,
          isAnonymous: data.isAnonymous === true,
          approved: data.approved === true,
          featured: data.featured === true,
          difficulty: data.difficulty || 2,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate()
        };
      }
    }
    
    // Try Realtime Database
    const testRef = rtdbRef(rtdb, `tests/${id}`);
    const snapshot = await get(testRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        id,
        ...data,
        createdAt: new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
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
    // Try Firestore first
    if (navigator.onLine) {
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
          thumbnailUrl: data.thumbnailUrl,
          playCount: data.playCount || 0,
          likeCount: data.likeCount || 0,
          isPublic: data.isPublic !== false,
          isAnonymous: data.isAnonymous === true,
          approved: data.approved === true,
          featured: data.featured === true,
          difficulty: data.difficulty || 2,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate()
        };
      }
    }
    
    // Try Realtime Database
    const testsRef = rtdbRef(rtdb, 'tests');
    const snapshot = await get(testsRef);
    
    if (snapshot.exists()) {
      const testsData = snapshot.val();
      const testKey = Object.keys(testsData).find(key => testsData[key].uuid === uuid);
      
      if (testKey) {
        const data = testsData[testKey];
        return {
          id: testKey,
          ...data,
          createdAt: new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching test by UUID ${uuid}:`, error);
    return null;
  }
}

export async function createTest(testData: Omit<Test, 'id' | 'uuid' | 'createdAt' | 'playCount' | 'likeCount'>): Promise<Test> {
  try {
    // Generate a unique ID for sharing
    const uuid = createId();
    
    // Prepare test data
    const newTest = {
      ...testData,
      uuid,
      playCount: 0,
      likeCount: 0,
      createdAt: serverTimestamp()
    };
    
    // Try Firestore first
    if (navigator.onLine) {
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'tests'), newTest);
      
      // Record user activity if creator is specified
      if (testData.creatorId) {
        await addDoc(collection(db, 'userActivities'), {
          userId: testData.creatorId,
          activityType: 'create_test',
          details: `Yeni test oluşturuldu: ${testData.title}`,
          entityId: docRef.id,
          entityType: 'test',
          createdAt: serverTimestamp()
        });
      }
      
      // Return the created test
      return {
        id: docRef.id,
        uuid,
        ...testData,
        playCount: 0,
        likeCount: 0,
        createdAt: new Date()
      };
    }
    
    // If offline, use Realtime Database
    const testsRef = rtdbRef(rtdb, 'tests');
    const newTestRef = push(testsRef);
    const testId = newTestRef.key!;
    
    const rtdbTest = {
      ...newTest,
      createdAt: new Date().toISOString()
    };
    
    await set(newTestRef, rtdbTest);
    
    // Return the created test
    return {
      id: testId,
      uuid,
      ...testData,
      playCount: 0,
      likeCount: 0,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Error creating test:', error);
    throw new Error('Test creation failed');
  }
}

export async function incrementTestPlayCount(id: string): Promise<void> {
  try {
    // Try Firestore first
    if (navigator.onLine) {
      const testRef = doc(db, 'tests', id);
      await updateDoc(testRef, {
        playCount: increment(1)
      });
      return;
    }
    
    // Try Realtime Database
    const testRef = rtdbRef(rtdb, `tests/${id}`);
    const snapshot = await get(testRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      await update(testRef, {
        playCount: (data.playCount || 0) + 1
      });
    }
  } catch (error) {
    console.error(`Error incrementing play count for test ${id}:`, error);
  }
}

export async function incrementTestLikeCount(id: string): Promise<void> {
  try {
    // Try Firestore first
    if (navigator.onLine) {
      const testRef = doc(db, 'tests', id);
      await updateDoc(testRef, {
        likeCount: increment(1)
      });
      return;
    }
    
    // Try Realtime Database
    const testRef = rtdbRef(rtdb, `tests/${id}`);
    const snapshot = await get(testRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      await update(testRef, {
        likeCount: (data.likeCount || 0) + 1
      });
    }
  } catch (error) {
    console.error(`Error incrementing like count for test ${id}:`, error);
  }
}

export async function getPopularTests(limitCount: number = 5): Promise<Test[]> {
  try {
    // Try Firestore first
    if (navigator.onLine) {
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
          thumbnailUrl: data.thumbnailUrl,
          playCount: data.playCount || 0,
          likeCount: data.likeCount || 0,
          isPublic: data.isPublic !== false,
          isAnonymous: data.isAnonymous === true,
          approved: data.approved === true,
          featured: data.featured === true,
          difficulty: data.difficulty || 2,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate()
        };
      });
    }
    
    // Try Realtime Database
    const testsRef = rtdbRef(rtdb, 'tests');
    const snapshot = await get(testsRef);
    
    if (snapshot.exists()) {
      const testsData = snapshot.val();
      return Object.keys(testsData)
        .filter(key => testsData[key].isPublic !== false && testsData[key].approved === true)
        .sort((a, b) => (testsData[b].playCount || 0) - (testsData[a].playCount || 0))
        .slice(0, limitCount)
        .map(key => ({
          id: key,
          ...testsData[key],
          createdAt: new Date(testsData[key].createdAt || Date.now()),
          updatedAt: testsData[key].updatedAt ? new Date(testsData[key].updatedAt) : undefined
        }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching popular tests:', error);
    return [];
  }
}

export async function getNewestTests(limitCount: number = 5): Promise<Test[]> {
  try {
    // Try Firestore first
    if (navigator.onLine) {
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
          thumbnailUrl: data.thumbnailUrl,
          playCount: data.playCount || 0,
          likeCount: data.likeCount || 0,
          isPublic: data.isPublic !== false,
          isAnonymous: data.isAnonymous === true,
          approved: data.approved === true,
          featured: data.featured === true,
          difficulty: data.difficulty || 2,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate()
        };
      });
    }
    
    // Try Realtime Database
    const testsRef = rtdbRef(rtdb, 'tests');
    const snapshot = await get(testsRef);
    
    if (snapshot.exists()) {
      const testsData = snapshot.val();
      return Object.keys(testsData)
        .filter(key => testsData[key].isPublic !== false && testsData[key].approved === true)
        .sort((a, b) => {
          const dateA = new Date(testsData[a].createdAt || 0).getTime();
          const dateB = new Date(testsData[b].createdAt || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, limitCount)
        .map(key => ({
          id: key,
          ...testsData[key],
          createdAt: new Date(testsData[key].createdAt || Date.now()),
          updatedAt: testsData[key].updatedAt ? new Date(testsData[key].updatedAt) : undefined
        }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching newest tests:', error);
    return [];
  }
}

export async function getFeaturedTests(limitCount: number = 5): Promise<Test[]> {
  try {
    // Try Firestore first
    if (navigator.onLine) {
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
          thumbnailUrl: data.thumbnailUrl,
          playCount: data.playCount || 0,
          likeCount: data.likeCount || 0,
          isPublic: data.isPublic !== false,
          isAnonymous: data.isAnonymous === true,
          approved: data.approved === true,
          featured: data.featured === true,
          difficulty: data.difficulty || 2,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate()
        };
      });
    }
    
    // Try Realtime Database
    const testsRef = rtdbRef(rtdb, 'tests');
    const snapshot = await get(testsRef);
    
    if (snapshot.exists()) {
      const testsData = snapshot.val();
      return Object.keys(testsData)
        .filter(key => 
          testsData[key].isPublic !== false && 
          testsData[key].approved === true && 
          testsData[key].featured === true
        )
        .sort((a, b) => {
          const dateA = new Date(testsData[a].createdAt || 0).getTime();
          const dateB = new Date(testsData[b].createdAt || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, limitCount)
        .map(key => ({
          id: key,
          ...testsData[key],
          createdAt: new Date(testsData[key].createdAt || Date.now()),
          updatedAt: testsData[key].updatedAt ? new Date(testsData[key].updatedAt) : undefined
        }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching featured tests:', error);
    return [];
  }
}

// File upload helper
export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    // Create a storage reference
    const storageRef = ref(storage, path);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('File upload failed');
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
    
    // Try Firestore first
    if (navigator.onLine) {
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
    }
    
    // If offline, use Realtime Database
    const scoresRef = rtdbRef(rtdb, 'gameScores');
    const newScoreRef = push(scoresRef);
    const scoreId = newScoreRef.key!;
    
    const rtdbScore = {
      ...newScore,
      createdAt: new Date().toISOString()
    };
    
    await set(newScoreRef, rtdbScore);
    
    // Update user score if userId is provided
    if (scoreData.userId) {
      const userRef = rtdbRef(rtdb, `users/${scoreData.userId}`);
      const userSnapshot = await get(userRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        await update(userRef, {
          score: (userData.score || 0) + scoreData.score
        });
      }
      
      // Record activity
      const activitiesRef = rtdbRef(rtdb, 'userActivities');
      await push(activitiesRef, {
        userId: scoreData.userId,
        activityType: 'game_score',
        details: `Oyun skoru: ${scoreData.score} puan, mod: ${scoreData.gameMode}`,
        entityType: 'game',
        createdAt: new Date().toISOString()
      });
    }
    
    // Return the created score
    return {
      id: scoreId,
      ...scoreData,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Error saving game score:', error);
    throw new Error('Game score saving failed');
  }
}

// Search function
export async function searchTests(query: string, categoryId?: string): Promise<Test[]> {
  try {
    // Try Firestore first
    if (navigator.onLine) {
      const testsRef = collection(db, 'tests');
      let q;
      
      // Base query conditions
      const conditions = [
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        limit(20)
      ];
      
      // Add category filter if provided
      if (categoryId) {
        conditions.push(where('categoryId', '==', categoryId));
      }
      
      // Execute query
      q = query(testsRef, ...conditions);
      const querySnapshot = await getDocs(q);
      
      // Filter results client-side for text search
      // Note: Firestore doesn't support full-text search natively
      // For production, consider using Algolia or Firebase Extensions for search
      let results = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uuid: data.uuid,
          title: data.title,
          description: data.description || '',
          creatorId: data.creatorId,
          categoryId: data.categoryId,
          questions: data.questions || [],
          thumbnailUrl: data.thumbnailUrl,
          playCount: data.playCount || 0,
          likeCount: data.likeCount || 0,
          isPublic: data.isPublic !== false,
          isAnonymous: data.isAnonymous === true,
          approved: data.approved === true,
          featured: data.featured === true,
          difficulty: data.difficulty || 2,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate()
        };
      });
      
      // Filter by search query if provided
      if (query && query.trim() !== '') {
        const normalizedQuery = query.toLowerCase().trim();
        results = results.filter(test => 
          test.title.toLowerCase().includes(normalizedQuery) || 
          (test.description && test.description.toLowerCase().includes(normalizedQuery))
        );
      }
      
      return results;
    }
    
    // Try Realtime Database
    const testsRef = rtdbRef(rtdb, 'tests');
    const snapshot = await get(testsRef);
    
    if (snapshot.exists()) {
      const testsData = snapshot.val();
      let results = Object.keys(testsData)
        .filter(key => testsData[key].isPublic !== false)
        .map(key => ({
          id: key,
          ...testsData[key],
          createdAt: new Date(testsData[key].createdAt || Date.now()),
          updatedAt: testsData[key].updatedAt ? new Date(testsData[key].updatedAt) : undefined
        }));
      
      // Apply category filter if provided
      if (categoryId) {
        results = results.filter(test => test.categoryId === categoryId);
      }
      
      // Apply text search if provided
      if (query && query.trim() !== '') {
        const normalizedQuery = query.toLowerCase().trim();
        results = results.filter(test => 
          test.title.toLowerCase().includes(normalizedQuery) || 
          (test.description && test.description.toLowerCase().includes(normalizedQuery))
        );
      }
      
      // Sort by created date (newest first)
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Limit results
      return results.slice(0, 20);
    }
    
    return [];
  } catch (error) {
    console.error('Error searching tests:', error);
    return [];
  }
}

// Initialize sample data in Realtime Database
export async function initializeSampleData(): Promise<void> {
  try {
    // Check if data already exists
    const rootRef = rtdbRef(rtdb, '/');
    const snapshot = await get(rootRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      // If we have data in at least 3 collections, consider it initialized
      if (data.categories && data.images && data.tests) {
        console.log('Sample data already exists in Realtime Database');
        return;
      }
    }
    
    console.log('Initializing sample data in Realtime Database...');
    
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
      }
    };
    
    // Write data to Realtime Database
    await set(rtdbRef(rtdb, 'categories'), categories);
    await set(rtdbRef(rtdb, 'images'), images);
    await set(rtdbRef(rtdb, 'tests'), tests);
    
    console.log('Sample data initialized in Realtime Database');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}

// Call this function to initialize sample data
// This should be called once when the app starts
initializeSampleData();