import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

export const DEFAULT_GUEST_USER: UserProfile = {
  id: 'guest-admin-001',
  email: 'guest@buildflow.ai',
  displayName: 'Enterprise Administrator',
  role: 'Super Admin',
  companyId: 'company-apex-123',
  onboarded: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  status: 'active'
};

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole, fullName: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  completeOnboarding: (companyId: string, companyDetails: any) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_GUEST_USER);
  const [loading, setLoading] = useState(true);

  // Synchronize Firestore user details when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            // First time Google or external sign in
            const now = new Date().toISOString();
            const defaultRole: UserRole = 'Super Admin'; // Full access default
            
            const newProfile: UserProfile = {
              id: fbUser.uid,
              email: fbUser.email || 'user@buildflow.ai',
              displayName: fbUser.displayName || 'Enterprise Administrator',
              role: defaultRole,
              companyId: 'company-apex-123',
              onboarded: true,
              createdAt: now,
              updatedAt: now,
              createdBy: fbUser.uid,
              status: 'active'
            };
            
            await setDoc(userDocRef, newProfile).catch(() => {});
            setUser(newProfile);
          }
        } catch (error) {
          console.error("Error retrieving user profile:", error);
          setUser(DEFAULT_GUEST_USER);
        }
      } else {
        // Automatically default to Guest User with full access - no email sign-in required!
        setUser(DEFAULT_GUEST_USER);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string, role: UserRole, fullName: string) => {
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = credential.user;
      
      const now = new Date().toISOString();
      const newProfile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || '',
        displayName: fullName,
        role: role || 'Super Admin',
        companyId: 'company-apex-123',
        onboarded: true,
        createdAt: now,
        updatedAt: now,
        createdBy: fbUser.uid,
        status: 'active'
      };
      
      await setDoc(doc(db, 'users', fbUser.uid), newProfile).catch(() => {});
      setUser(newProfile);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const googleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth).catch(() => {});
      // Reset to Guest User with full access
      setUser(DEFAULT_GUEST_USER);
      setFirebaseUser(null);
      setLoading(false);
    } catch (error) {
      setUser(DEFAULT_GUEST_USER);
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const completeOnboarding = async (companyId: string, companyDetails: any) => {
    const now = new Date().toISOString();
    const activeUid = firebaseUser ? firebaseUser.uid : (user?.id || 'guest-admin-001');
    const userDocRef = doc(db, 'users', activeUid);
    const companyDocRef = doc(db, 'companies', companyId);
    
    // 1. Create company details in Firestore
    await setDoc(companyDocRef, {
      ...companyDetails,
      id: companyId,
      createdAt: now,
      updatedAt: now,
      createdBy: activeUid,
      status: 'active'
    }).catch(() => {});

    // 2. Update user profile
    const updatedProfileUpdates = {
      companyId: companyId,
      onboarded: true,
      updatedAt: now
    };
    if (firebaseUser) {
      await updateDoc(userDocRef, updatedProfileUpdates).catch(() => {});
    }
    
    setUser((prev) => prev ? { ...prev, ...updatedProfileUpdates } : { ...DEFAULT_GUEST_USER, ...updatedProfileUpdates });
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    const now = new Date().toISOString();
    const updates = {
      ...data,
      updatedAt: now
    };
    
    if (firebaseUser) {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, updates).catch(() => {});
    }
    setUser((prev) => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      login,
      signup,
      googleLogin,
      logout,
      resetPassword,
      completeOnboarding,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
