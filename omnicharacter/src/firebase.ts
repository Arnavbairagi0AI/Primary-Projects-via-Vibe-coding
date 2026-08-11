/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Configuration from generated file
const firebaseConfig = {
  apiKey: "AIzaSyDsnaKTgjbdejv66kie2I4SkC_BsYIyLvQ",
  authDomain: "acoustic-gist-zjkjx.firebaseapp.com",
  projectId: "acoustic-gist-zjkjx",
  storageBucket: "acoustic-gist-zjkjx.firebasestorage.app",
  messagingSenderId: "696072134698",
  appId: "1:696072134698:web:fcfd09dcb791914f896353"
};

const databaseId = "ai-studio-a8e08db2-e11f-4816-a1e2-3880207c8e1c";

// Initialize Firebase App
let app;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (error) {
  console.error("Firebase App Initialization Error", error);
}

// Initialize Auth
export const auth = app ? getAuth(app) : null;

// Initialize Firestore with Custom Database ID
export const db = app 
  ? initializeFirestore(app, {}, databaseId) 
  : null;

console.log("Firebase initialized successfully with project ID", firebaseConfig.projectId, "and database ID", databaseId);
