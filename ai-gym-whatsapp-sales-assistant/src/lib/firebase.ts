import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDsnaKTgjbdejv66kie2I4SkC_BsYIyLvQ",
  authDomain: "acoustic-gist-zjkjx.firebaseapp.com",
  projectId: "acoustic-gist-zjkjx",
  storageBucket: "acoustic-gist-zjkjx.firebasestorage.app",
  messagingSenderId: "696072134698",
  appId: "1:696072134698:web:fcfd09dcb791914f896353"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-06a208ef-e970-4ac9-8976-839a373fa170");

// Verify connection as specified in the Firebase integration skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.error("Please check your Firebase configuration or network status.", error);
    } else {
      console.log("Firebase initialized.");
    }
  }
}
testConnection();
