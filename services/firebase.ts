
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  collection, 
  addDoc, 
  updateDoc,
  setDoc,
  doc, 
  getDoc,
  getDocs, 
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import type { FieldValue } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

// Helper to resolve environment variables
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[key];
      if (val) return val;
    }
  } catch (e) {}

  try {
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[key];
      if (val) return val;
    }
  } catch (e) {}

  return undefined;
};

// 1. Try LocalStorage Override (Runtime Config via UI)
const LOCAL_CONFIG_KEY = 'conservatory_firebase_config';
let localConfig = null;
try {
  const stored = localStorage.getItem(LOCAL_CONFIG_KEY);
  if (stored) localConfig = JSON.parse(stored);
} catch (e) {
  console.warn("Failed to parse local firebase config", e);
}

// 2. Project-specific credentials
const firebaseConfig = {
  apiKey: localConfig?.apiKey || getEnv('VITE_FIREBASE_API_KEY') || "AIzaSyDf7A1EK0AlQckJjkLbI93Lu1EvWIH-Rws",
  authDomain: localConfig?.authDomain || getEnv('VITE_FIREBASE_AUTH_DOMAIN') || "the-conservatory-d858b.firebaseapp.com",
  projectId: localConfig?.projectId || getEnv('VITE_FIREBASE_PROJECT_ID') || "the-conservatory-d858b",
  storageBucket: localConfig?.storageBucket || getEnv('VITE_FIREBASE_STORAGE_BUCKET') || "the-conservatory-d858b.firebasestorage.app",
  messagingSenderId: localConfig?.messagingSenderId || getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || "814637797090",
  appId: localConfig?.appId || getEnv('VITE_FIREBASE_APP_ID') || "1:814637797090:web:feb2cda6730397ca9f18bb",
  measurementId: localConfig?.measurementId || getEnv('VITE_FIREBASE_MEASUREMENT_ID') || "G-1JKV6H7WDL"
};

console.log("Using Firebase Config:", firebaseConfig);

// Initialize App (Idempotent)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Services explicitly linked to the app instance
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with persistent cache (new API)
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

console.log("Initializing Firestore with databaseId: 'theconservatory' (Build: " + new Date().toISOString() + ")");
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, 'theconservatory');

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

/**
 * Explicitly export firebase functions used by store.ts and other services
 */
export { 
  collection, addDoc, updateDoc, setDoc, doc, getDoc, getDocs,
  serverTimestamp, onSnapshot, query, orderBy, 
  limit, onAuthStateChanged, signInWithPopup, signOut, 
  writeBatch
};
export type { FieldValue, User };
