import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBmjt6T-bdcnPPI5lK_1Yw8XzKFINnJURQ",
  authDomain: "gen-lang-client-0926566041.firebaseapp.com",
  projectId: "gen-lang-client-0926566041",
  storageBucket: "gen-lang-client-0926566041.firebasestorage.app",
  messagingSenderId: "334204290505",
  appId: "1:334204290505:web:65230f7bed0ca34c5a5418"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Use getFirestore(app, databaseId) to target custom Firestore databases correctly
const db = getFirestore(app, "ai-studio-reviewrangerai-db6195c8-3dc8-4cb8-b3e1-18e929de5614");

export { app, auth, db, googleProvider };
