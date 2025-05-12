import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

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

// Connect to emulators in development
if (import.meta.env.DEV && window.location.hostname === 'localhost') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectDatabaseEmulator(rtdb, 'localhost', 9000);
  } catch (error) {
    console.error('Error connecting to Firebase emulators:', error);
  }
}

export { app, auth, db, storage, rtdb };