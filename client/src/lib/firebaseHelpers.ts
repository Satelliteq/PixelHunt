import { db, storage } from './firebase';
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
    const categoriesRef = collection(db, 'categories').withConverter(categoryConverter);
    const q = query(categoriesRef, where('active', '==', true), orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getCategory(id: string): Promise<Category | null> {
  try {
    const docRef = doc(db, 'categories', id).withConverter(categoryConverter);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
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
  } catch (error) {
    console.error('Error creating test:', error);
    throw new Error('Test creation failed');
  }
}

export async function incrementTestPlayCount(id: string): Promise<void> {
  try {
    const testRef = doc(db, 'tests', id);
    await updateDoc(testRef, {
      playCount: increment(1)
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

export async function getPopularTests(limit: number = 5): Promise<Test[]> {
  try {
    const testsRef = collection(db, 'tests');
    const q = query(
      testsRef,
      where('isPublic', '==', true),
      where('approved', '==', true),
      orderBy('playCount', 'desc'),
      limit(limit)
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
  } catch (error) {
    console.error('Error fetching popular tests:', error);
    return [];
  }
}

export async function getNewestTests(limit: number = 5): Promise<Test[]> {
  try {
    const testsRef = collection(db, 'tests');
    const q = query(
      testsRef,
      where('isPublic', '==', true),
      where('approved', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limit)
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
  } catch (error) {
    console.error('Error fetching newest tests:', error);
    return [];
  }
}

export async function getFeaturedTests(limit: number = 5): Promise<Test[]> {
  try {
    const testsRef = collection(db, 'tests');
    const q = query(
      testsRef,
      where('isPublic', '==', true),
      where('approved', '==', true),
      where('featured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limit)
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

// Search function
export async function searchTests(query: string, categoryId?: string): Promise<Test[]> {
  try {
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
  } catch (error) {
    console.error('Error searching tests:', error);
    return [];
  }
}