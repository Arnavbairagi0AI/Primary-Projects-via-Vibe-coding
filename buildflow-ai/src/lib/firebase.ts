import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Hardcoded fallbacks from firebase-applet-config.json for instant out-of-the-box operation in AI Studio
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyDNxlliuq9G_icOtEnJD_1OFdxCR9q0U44",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "buildflowai-b2130.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "buildflowai-b2130",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "buildflowai-b2130.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "23972189524",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:23972189524:web:d54010fd9828ce69cae4c1"
};

const databaseId = metaEnv.VITE_FIREBASE_DATABASE_ID || "(default)";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Initialize Firestore with the specific custom database ID provisioned by the platform
const db = getFirestore(app, databaseId);

export { app, auth, db };
