import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  collection, 
  addDoc, 
  updateDoc,
  doc, 
  getDoc, 
  serverTimestamp,
  FieldValue,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';

// Helper to resolve environment variables
const getEnv = (key: string, legacyKey?: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[key] || (legacyKey ? import.meta.env[legacyKey] : undefined);
      if (val) return val;
    }
  } catch (e) {}

  try {
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[key] || (legacyKey ? process.env[legacyKey] : undefined);
      if (val) return val;
    }
  } catch (e) {}

  return undefined;
};

// 1. Try LocalStorage Override (Runtime Config)
const LOCAL_CONFIG_KEY = 'conservatory_firebase_config';
let localConfig = null;
try {
  const stored = localStorage.getItem(LOCAL_CONFIG_KEY);
  if (stored) localConfig = JSON.parse(stored);
} catch (e) {
  console.warn("Failed to parse local firebase config", e);
}

// 2. Fallback to Env Vars, then Placeholders
const envConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', 'REACT_APP_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'REACT_APP_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'REACT_APP_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'REACT_APP_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID', 'REACT_APP_FIREBASE_APP_ID')
};

// Merge: Local > Env > Placeholder
const firebaseConfig = {
  apiKey: localConfig?.apiKey || envConfig.apiKey || "AIzaSy_PLACEHOLDER",
  authDomain: localConfig?.authDomain || envConfig.authDomain || "project.firebaseapp.com",
  projectId: localConfig?.projectId || envConfig.projectId || "project-id",
  storageBucket: localConfig?.storageBucket || envConfig.storageBucket || "project.appspot.com",
  messagingSenderId: localConfig?.messagingSenderId || envConfig.messagingSenderId || "123456789",
  appId: localConfig?.appId || envConfig.appId || "1:123456789:web:abc12345"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open');
  } else if (err.code == 'unimplemented') {
      console.warn('Persistence not supported by browser');
  }
});

export { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp, onSnapshot, query, orderBy, limit };
export type { FieldValue };