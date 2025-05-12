import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_API_KEY || "AIzaSyBtHxrkA9kcUQZyJp9bA48Evyt5U-7AVoQ",
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN || "pixelhunt-7afa8.firebaseapp.com",
  projectId: import.meta.env.FIREBASE_PROJECT_ID || "pixelhunt-7afa8",
  storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET || "pixelhunt-7afa8.appspot.com",
  messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID || "595531085941",
  appId: import.meta.env.FIREBASE_APP_ID || "1:595531085941:web:9bd7b5f890098211d2a03c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.DEV && window.location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

export { app, auth, db, storage };