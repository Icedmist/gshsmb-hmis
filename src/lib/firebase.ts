import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBAPDC4DI9JtrNli_r6YHyZNy-lX72FwYo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gshms-76f30.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gshms-76f30',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gshms-76f30.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '487972944230',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:487972944230:web:d9f48fc6c21ac8a7fef0a7',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-EWLW4V82JJ',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Set persistence to localStorage so auth survives page refresh
setPersistence(auth, browserLocalPersistence).catch(() => {});
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export default app;
