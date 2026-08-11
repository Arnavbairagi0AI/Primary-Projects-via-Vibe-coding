import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyDnicveJlt3PD49GAPwFjt4qTl4lfzaUZo",
  authDomain: "gen-lang-client-0324852513.firebaseapp.com",
  projectId: "gen-lang-client-0324852513",
  storageBucket: "gen-lang-client-0324852513.firebasestorage.app",
  messagingSenderId: "318831845654",
  appId: "1:318831845654:web:82e2017bf0f83dbb117037"
};

const app = initializeApp(firebaseConfig);

// Custom Firestore initialization supporting specific databaseId
export const db = initializeFirestore(app, {}, "ai-studio-468421cb-4a65-4efe-b67d-c63653880ad4");

export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default app;
