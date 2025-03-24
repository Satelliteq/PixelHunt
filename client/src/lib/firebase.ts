import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, UserCredential } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, addDoc, orderBy, limit, increment, deleteDoc, Timestamp } from "firebase/firestore";

// Firebase yapılandırma bilgileri
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase'i başlat
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Kullanıcı kimlik doğrulama işlevleri
export const signInWithGoogle = async (): Promise<UserCredential> => {
  return signInWithPopup(auth, googleProvider);
};

export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logOut = async (): Promise<void> => {
  return signOut(auth);
};

// Firestore Helper Fonksiyonları
export const createUserProfile = async (uid: string, userData: any): Promise<void> => {
  await setDoc(doc(db, "users", uid), {
    ...userData,
    createdAt: Timestamp.now(),
  });
};

export const updateUserProfile = async (uid: string, data: any): Promise<void> => {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const getUserProfile = async (uid: string): Promise<any> => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() };
  }
  return null;
};

export const isUserAdmin = async (uid: string): Promise<boolean> => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    return userData.role === "admin" || userData.isAdmin === true;
  }
  return false;
};

// Firebase'in hazır olup olmadığını kontrol eden yardımcı fonksiyon
export const isFirebaseConfigured = (): boolean => {
  return !!firebaseConfig.apiKey && !!firebaseConfig.authDomain;
};

// Bu modülü varsayılan olarak dışa aktar
export default {
  app,
  auth,
  db,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  logOut,
  createUserProfile,
  updateUserProfile,
  getUserProfile,
  isUserAdmin,
  isFirebaseConfigured,
};