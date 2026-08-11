import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection,
  doc,
  getDocFromServer,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  deleteDoc,
  onSnapshot,
  enableNetwork,
  disableNetwork,
  Firestore
} from "firebase/firestore";

// Read config
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Offline Local Cache Persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Auth
const auth = getAuth(app);

// Provider
const googleProvider = new GoogleAuthProvider();

// Test server connection as requested by firebase-integration skill
async function testConnection() {
  try {
    // Attempt to test connectivity with firestore
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration or internet connection. App is running in offline mode.");
    }
  }
}
testConnection();

export interface FirebaseDiagnostic {
  isConfigured: boolean;
  isFirebaseAppInitialized: boolean;
  canReachFirestore: boolean;
  canReachAuth: boolean;
  latencyMs?: number;
  error?: string;
  isOfflineMode: boolean;
}

export async function runFirebaseDiagnostics(): Promise<FirebaseDiagnostic> {
  const diagnostic: FirebaseDiagnostic = {
    isConfigured: false,
    isFirebaseAppInitialized: false,
    canReachFirestore: false,
    canReachAuth: false,
    isOfflineMode: false,
  };

  try {
    // 1. Check configuration
    if (
      firebaseConfig &&
      firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      !firebaseConfig.apiKey.includes("YOUR_API_KEY")
    ) {
      diagnostic.isConfigured = true;
    } else {
      diagnostic.error = "Firebase configuration is unconfigured or contains placeholder values.";
      return diagnostic;
    }

    // 2. Check if App is initialized
    if (app) {
      diagnostic.isFirebaseAppInitialized = true;
    } else {
      diagnostic.error = "Firebase app instance failed to initialize.";
      return diagnostic;
    }

    // 3. Check Auth instance
    if (auth) {
      diagnostic.canReachAuth = true;
    } else {
      diagnostic.error = "Firebase authentication service failed to initialize.";
      return diagnostic;
    }

    // 4. Test firestore connection
    const startTime = Date.now();
    try {
      // 4 second timeout wrapper to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firestore connection timed out after 4 seconds")), 4000)
      );

      const testDocRef = doc(db, "_diagnostics", "heartbeat");
      await Promise.race([
        getDocFromServer(testDocRef),
        timeoutPromise
      ]);

      diagnostic.latencyMs = Date.now() - startTime;
      diagnostic.canReachFirestore = true;
    } catch (fsErr: any) {
      console.warn("Diagnostics Firestore test failed:", fsErr);
      diagnostic.error = fsErr?.message || String(fsErr);
      if (
        (fsErr instanceof Error && fsErr.message.includes("offline")) ||
        String(fsErr).toLowerCase().includes("offline") ||
        String(fsErr).toLowerCase().includes("network")
      ) {
        diagnostic.isOfflineMode = true;
      }
    }
  } catch (globalErr: any) {
    diagnostic.error = "Diagnostics critical failure: " + (globalErr?.message || String(globalErr));
  }

  return diagnostic;
}

export {
  app,
  db,
  auth,
  googleProvider,
  signInAnonymously,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  onSnapshot,
  enableNetwork,
  disableNetwork
};

export type { FirebaseUser, Firestore };
