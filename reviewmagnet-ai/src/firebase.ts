import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase Applet Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBC8ykVPPf1EtKBwL2D-85kLFMVCLjp1L4",
  authDomain: "gen-lang-client-0606472912.firebaseapp.com",
  projectId: "gen-lang-client-0606472912",
  storageBucket: "gen-lang-client-0606472912.firebasestorage.app",
  messagingSenderId: "341640265473",
  appId: "1:341640265473:web:f22117d234094660f52500"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-d437bfc4-bf2b-47ee-aa88-f2bf121c8e22");
export default app;
