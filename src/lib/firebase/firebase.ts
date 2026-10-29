import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'your-api-key-here' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'your-project-id'
  );
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // If local emulator is requested
    if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      const authEmulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://localhost:9099';
      const firestoreHost = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost';
      const firestorePort = Number(import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT) || 8080;
      const storageHost = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || 'localhost';
      const storagePort = Number(import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT) || 9199;

      connectAuthEmulator(auth, authEmulatorHost);
      connectFirestoreEmulator(db, firestoreHost, firestorePort);
      connectStorageEmulator(storage, storageHost, storagePort);
      console.info('🔌 Connected to Firebase Emulator Suite');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase SDK:', error);
  }
}

export { app, auth, db, storage };
