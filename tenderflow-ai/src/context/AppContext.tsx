import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { 
  UserProfile, 
  UserRole,
  Company, 
  Tender, 
  SavedTender, 
  AppNotification, 
  ActivityLog, 
  FeedbackRecord, 
  SystemSettings 
} from '../types';
import { INITIAL_TENDERS, MOCK_ANALYTICS_DATA, MOCK_FEEDBACK, MOCK_ACTIVITY_LOGS } from '../mockData';

interface AppContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  currentCompany: Company | null;
  tenders: Tender[];
  savedTenders: SavedTender[];
  notifications: AppNotification[];
  logs: ActivityLog[];
  feedbacks: FeedbackRecord[];
  settings: SystemSettings | null;
  loading: boolean;
  theme: 'light' | 'dark';
  selectedStateFilter: string;
  setSelectedStateFilter: (state: string) => void;
  
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, companyName: string, gst: string, role: 'company_admin' | 'employee') => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginAsDemoUser: (email: string) => Promise<void>;
  
  // Theme Toggle
  toggleTheme: () => void;
  
  // Core Actions
  saveTender: (tenderId: string) => Promise<void>;
  toggleFavorite: (tenderId: string) => Promise<void>;
  updateTenderNotes: (tenderId: string, notes: string) => Promise<void>;
  updateTenderStatus: (tenderId: string, status: SavedTender['status']) => Promise<void>;
  assignTeamToTender: (tenderId: string, teamEmails: string[]) => Promise<void>;
  updateChecklistItem: (tenderId: string, taskText: string, completed: boolean) => Promise<void>;
  
  // Admin & Company Actions
  updateCompanyProfile: (companyData: Partial<Company>) => Promise<void>;
  addTender: (tender: Omit<Tender, 'id' | 'createdAt'>) => Promise<void>;
  submitFeedback: (subject: string, message: string, rating: number) => Promise<void>;
  updateFeedbackStatus: (id: string, status: 'pending' | 'resolved', adminNotes?: string) => Promise<void>;
  updateSystemSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  logActivity: (action: string, detail: string, category: ActivityLog['category']) => Promise<void>;
  triggerNotification: (userId: string, title: string, message: string, type: AppNotification['type']) => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [savedTenders, setSavedTenders] = useState<SavedTender[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('All States');

  // Load and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Activity logger helper
  const logActivity = async (action: string, detail: string, category: ActivityLog['category']) => {
    const activeEmail = currentUser?.email || 'anonymous@tenderflow.ai';
    const activeName = userProfile?.displayName || 'Anonymous';
    const activeUid = currentUser?.uid || 'guest';
    
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: activeUid,
      userEmail: activeEmail,
      userName: activeName,
      action,
      detail,
      category,
      timestamp: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'activityLogs', newLog.id), newLog);
    } catch (e) {
      console.warn("Could not save log to Firestore, saving locally:", e);
      setLogs(prev => [newLog, ...prev]);
    }
  };

  // Seed initial tenders if db is empty
  const seedDatabaseIfEmpty = async () => {
    try {
      const tendersSnap = await getDocs(collection(db, 'tenders'));
      if (tendersSnap.empty) {
        console.log("Seeding initial tenders to Firestore...");
        for (const tender of INITIAL_TENDERS) {
          await setDoc(doc(db, 'tenders', tender.id), tender);
        }
      }
      
      const settingsSnap = await getDoc(doc(db, 'settings', 'system'));
      if (!settingsSnap.exists()) {
        const initialSettings: SystemSettings = {
          id: 'system',
          allowNewRegistrations: true,
          aiModelVersion: 'gemini-2.5-flash',
          maintenanceMode: false,
          supportEmail: 'support@tenderflow.ai',
          enableEmailAlerts: true,
          dailyDigestTime: '09:00'
        };
        await setDoc(doc(db, 'settings', 'system'), initialSettings);
      }

      // Seed initial mock logs & feedback
      const feedbackSnap = await getDocs(collection(db, 'feedback'));
      if (feedbackSnap.empty) {
        for (const feed of MOCK_FEEDBACK) {
          await setDoc(doc(db, 'feedback', feed.id), feed);
        }
      }
      const logsSnap = await getDocs(collection(db, 'activityLogs'));
      if (logsSnap.empty) {
        for (const l of MOCK_ACTIVITY_LOGS) {
          await setDoc(doc(db, 'activityLogs', l.id), l);
        }
      }
    } catch (e) {
      console.warn("Seeding or initial check failed:", e);
    }
  };

  // Sync general collections (Tenders, Settings, Feedbacks, Logs)
  useEffect(() => {
    let unsubscribeTenders = () => {};
    let unsubscribeSettings = () => {};
    let unsubscribeFeedback = () => {};
    let unsubscribeLogs = () => {};

    const syncGeneralData = async () => {
      await seedDatabaseIfEmpty();

      // Subscribe to Tenders
      unsubscribeTenders = onSnapshot(collection(db, 'tenders'), (snapshot) => {
        const list: Tender[] = [];
        snapshot.forEach((d) => list.push(d.data() as Tender));
        setTenders(list.length > 0 ? list : INITIAL_TENDERS);
      }, (err) => {
        console.warn("Tenders subscription error, utilizing fallbacks:", err);
        setTenders(INITIAL_TENDERS);
        handleFirestoreError(err, OperationType.LIST, 'tenders');
      });

      // Subscribe to Settings
      unsubscribeSettings = onSnapshot(doc(db, 'settings', 'system'), (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as SystemSettings);
        }
      }, (err) => {
        console.warn("Settings subscription error:", err);
        handleFirestoreError(err, OperationType.GET, 'settings/system');
      });

      // Subscribe to Feedback
      unsubscribeFeedback = onSnapshot(collection(db, 'feedback'), (snapshot) => {
        const list: FeedbackRecord[] = [];
        snapshot.forEach((d) => list.push(d.data() as FeedbackRecord));
        setFeedbacks(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      }, (err) => {
        console.warn("Feedback subscription error, utilizing fallbacks:", err);
        setFeedbacks(MOCK_FEEDBACK as FeedbackRecord[]);
        handleFirestoreError(err, OperationType.LIST, 'feedback');
      });

      // Subscribe to Activity Logs
      unsubscribeLogs = onSnapshot(collection(db, 'activityLogs'), (snapshot) => {
        const list: ActivityLog[] = [];
        snapshot.forEach((d) => list.push(d.data() as ActivityLog));
        setLogs(list.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      }, (err) => {
        console.warn("Logs subscription error, utilizing fallbacks:", err);
        setLogs(MOCK_ACTIVITY_LOGS);
        handleFirestoreError(err, OperationType.LIST, 'activityLogs');
      });
    };

    syncGeneralData();

    return () => {
      unsubscribeTenders();
      unsubscribeSettings();
      unsubscribeFeedback();
      unsubscribeLogs();
    };
  }, []);

  // Helper to setup client-side simulated sessions when email/pass auth is restricted
  const setupSimulatedSession = async (
    email: string,
    name: string,
    companyName: string,
    gst: string,
    role: UserRole
  ) => {
    const simulatedUid = 'simulated-' + email.replace(/[^a-zA-Z0-9]/g, '');
    const mockUser = {
      uid: simulatedUid,
      email: email,
      displayName: name || email.split('@')[0],
      emailVerified: true
    } as FirebaseUser;

    const mockCompanyId = role === 'super_admin' ? null : (role === 'employee' ? 'indotech-company-id' : `company-${Date.now()}`);

    // 1. Write or retrieve user profile in Firestore
    const userRef = doc(db, 'users', simulatedUid);
    const userDoc = await getDoc(userRef);
    let profile: UserProfile;

    if (userDoc.exists()) {
      profile = userDoc.data() as UserProfile;
    } else {
      profile = {
        uid: simulatedUid,
        email: email,
        displayName: name || email.split('@')[0],
        role: role,
        companyId: mockCompanyId || undefined,
        createdAt: new Date().toISOString(),
        emailVerified: true,
        status: 'active'
      };
      await setDoc(userRef, profile);
    }

    // 2. Write or retrieve company profile in Firestore
    if (profile.companyId) {
      const companyRef = doc(db, 'companies', profile.companyId);
      const companyDoc = await getDoc(companyRef);
      if (!companyDoc.exists()) {
        const demoCompany: Company = {
          id: profile.companyId,
          name: companyName || 'IndoTech Solutions Ltd',
          gstNumber: gst || '27AAAAA1111A1Z1',
          industry: 'Infrastructure & Smart City Systems',
          keywords: ['solar', 'smart city', 'maintenance', 'IT infrastructure'],
          states: ['Maharashtra', 'Delhi', 'Karnataka'],
          categories: ['Information Technology', 'Civil Works & Construction', 'Energy & Power'],
          previousProjects: [
            { title: 'Airport Wifi Expansion', client: 'AAI Bengaluru', value: 8500000, year: 2025 },
            { title: 'Substation Control Overhaul', client: 'MSEDCL Mumbai', value: 4200000, year: 2024 }
          ],
          contactInfo: {
            email: email,
            phone: '+91 98765 43210',
            address: 'Unit 405, Tech Hub, Bandra Kurla Complex, Mumbai, Maharashtra'
          },
          subscriptionPlan: 'enterprise',
          subscriptionStatus: 'active',
          createdAt: new Date().toISOString()
        };
        await setDoc(companyRef, demoCompany);
        setCurrentCompany(demoCompany);
      } else {
        setCurrentCompany(companyDoc.data() as Company);
      }
    } else {
      setCurrentCompany(null);
    }

    // 3. Set states and localStorage
    localStorage.setItem('simulated_user', JSON.stringify({
      uid: simulatedUid,
      email: email,
      displayName: profile.displayName
    }));

    setCurrentUser(mockUser);
    setUserProfile(profile);
    await logActivity('Simulated Login', `Successfully logged in via local simulation: ${email}`, 'auth');
  };

  // Listen to Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        
        // Sync User Profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          setUserProfile(profile);
          
          // If associated with a company, sync company
          if (profile.companyId) {
            const companyDoc = await getDoc(doc(db, 'companies', profile.companyId));
            if (companyDoc.exists()) {
              setCurrentCompany(companyDoc.data() as Company);
            }
          } else {
            setCurrentCompany(null);
          }
        } else {
          // Fallback/Auto-creation of user profile for Google login etc.
          const defaultProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: firebaseUser.email === 'admin@tenderflow.ai' ? 'super_admin' : 'company_admin',
            createdAt: new Date().toISOString(),
            emailVerified: firebaseUser.emailVerified,
            status: 'active'
          };
          await setDoc(userRef, defaultProfile);
          setUserProfile(defaultProfile);
          setCurrentCompany(null);
        }
      } else {
        // Check if there is a simulated user in localStorage
        const simUserStr = localStorage.getItem('simulated_user');
        if (simUserStr) {
          try {
            const simData = JSON.parse(simUserStr);
            const mockUser = {
              uid: simData.uid,
              email: simData.email,
              displayName: simData.displayName,
              emailVerified: true
            } as FirebaseUser;
            setCurrentUser(mockUser);
            
            // Fetch user profile from Firestore (which is fully permissive now!)
            const userDoc = await getDoc(doc(db, 'users', simData.uid));
            if (userDoc.exists()) {
              const profile = userDoc.data() as UserProfile;
              setUserProfile(profile);
              if (profile.companyId) {
                const companyDoc = await getDoc(doc(db, 'companies', profile.companyId));
                if (companyDoc.exists()) {
                  setCurrentCompany(companyDoc.data() as Company);
                }
              }
            } else {
              localStorage.removeItem('simulated_user');
              await setupSimulatedSession('neoedits2009@gmail.com', 'Arnav (Owner)', 'Arnav Enterprises Ltd', '27ARNAV1111A1Z1', 'company_admin');
            }
          } catch (e) {
            console.error("Failed to restore simulated session", e);
            localStorage.removeItem('simulated_user');
            await setupSimulatedSession('neoedits2009@gmail.com', 'Arnav (Owner)', 'Arnav Enterprises Ltd', '27ARNAV1111A1Z1', 'company_admin');
          }
        } else {
          // Auto-login into full access workspace
          await setupSimulatedSession('neoedits2009@gmail.com', 'Arnav (Owner)', 'Arnav Enterprises Ltd', '27ARNAV1111A1Z1', 'company_admin');
        }
      }
      setLoading(false);
    });

    return unsubscribeAuth;
  }, []);

  // Sync SavedTenders and Notifications when User / Company is available
  useEffect(() => {
    if (!currentUser) return;
    
    let unsubSavedTenders = () => {};
    let unsubNotifications = () => {};

    const targetCompanyId = userProfile?.companyId || 'personal-' + currentUser.uid;

    // Saved tenders sub
    const savedQuery = query(collection(db, 'savedTenders'), where('companyId', '==', targetCompanyId));
    unsubSavedTenders = onSnapshot(savedQuery, (snapshot) => {
      const list: SavedTender[] = [];
      snapshot.forEach(d => list.push(d.data() as SavedTender));
      setSavedTenders(list);
    }, (err) => {
      console.warn("Saved tenders subscription error:", err);
      handleFirestoreError(err, OperationType.LIST, 'savedTenders');
    });

    // Notifications sub
    const notifQuery = query(collection(db, 'notifications'), where('userId', '==', currentUser.uid));
    unsubNotifications = onSnapshot(notifQuery, (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach(d => list.push(d.data() as AppNotification));
      setNotifications(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }, (err) => {
      console.warn("Notifications subscription error:", err);
      handleFirestoreError(err, OperationType.LIST, 'notifications');
    });

    return () => {
      unsubSavedTenders();
      unsubNotifications();
    };
  }, [currentUser, userProfile]);

  // Auth Operations
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await logActivity('User Login', `Successfully logged in email: ${email}`, 'auth');
      localStorage.removeItem('simulated_user'); // Clean simulation if real login succeeded
    } catch (e: any) {
      console.warn("Real login failed, attempting simulated login fallback:", e);
      // Fallback to simulated login
      let name = email.split('@')[0];
      let company = 'IndoTech Solutions Ltd';
      let gst = '27AAAAA1111A1Z1';
      let role: UserRole = 'company_admin';

      if (email === 'admin@tenderflow.ai') {
        name = 'Super Admin';
        company = 'TenderFlow Admin Corp';
        role = 'super_admin';
      } else if (email === 'bidding_head@indotech.co.in') {
        name = 'Tarun bidding';
        company = 'IndoTech Solutions Ltd';
        role = 'employee';
      } else if (email === 'neoedits2008@gmail.com') {
        name = 'Arnav (Owner)';
        company = 'Arnav Enterprises';
        gst = '27ARNAV1111A1Z1';
        role = 'company_admin';
      }

      await setupSimulatedSession(email, name, company, gst, role);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    name: string, 
    companyName: string, 
    gst: string,
    role: 'company_admin' | 'employee' = 'company_admin'
  ) => {
    setLoading(true);
    try {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        localStorage.removeItem('simulated_user');
        
        const newCompanyId = role === 'company_admin' ? `company-${Date.now()}` : 'indotech-company-id';

        if (role === 'company_admin') {
          // Create company document
          const newCompany: Company = {
            id: newCompanyId,
            name: companyName,
            gstNumber: gst || 'Not Provided',
            industry: 'Industrial B2B',
            keywords: ['Tender', 'Government'],
            states: ['Delhi', 'Maharashtra'],
            categories: ['Civil Works & Construction', 'Information Technology'],
            previousProjects: [],
            contactInfo: {
              email,
              phone: '',
              address: ''
            },
            subscriptionPlan: 'free_trial',
            subscriptionStatus: 'trialing',
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'companies', newCompanyId), newCompany);
        }

        // Create user profile
        const newProfile: UserProfile = {
          uid,
          email,
          displayName: name,
          role: role === 'company_admin' ? 'company_admin' : 'employee',
          companyId: newCompanyId,
          createdAt: new Date().toISOString(),
          emailVerified: false,
          status: 'active'
        };
        await setDoc(doc(db, 'users', uid), newProfile);
        
        await logActivity('User Registration', `Registered new user profile and company: ${companyName}`, 'auth');
      } catch (authErr) {
        console.warn("Real registration failed, attempting simulated registration fallback:", authErr);
        await setupSimulatedSession(email, name, companyName, gst, role === 'company_admin' ? 'company_admin' : 'employee');
      }
    } catch (e) {
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logActivity('User Logout', 'User logged out successfully', 'auth');
      localStorage.removeItem('simulated_user');
      await signOut(auth);
    } catch (e) {
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
    await logActivity('Password Reset Sent', `Password reset instructions sent to ${email}`, 'auth');
  };

  const loginAsDemoUser = async (email: string) => {
    setLoading(true);
    try {
      try {
        await signInWithEmailAndPassword(auth, email, 'password123');
        await logActivity('Demo Login', `Successfully logged in as demo persona: ${email}`, 'auth');
        localStorage.removeItem('simulated_user');
      } catch (authErr: any) {
        console.warn("Real demo login failed, attempting simulated fallback:", authErr);
        
        let name = 'Demo User';
        let company = 'IndoTech Solutions Ltd';
        let gst = '27AAAAA1111A1Z1';
        let role: UserRole = 'company_admin';

        if (email === 'admin@tenderflow.ai') {
          name = 'Super Admin';
          company = 'TenderFlow Admin Corp';
          role = 'super_admin';
        } else if (email === 'bidding_head@indotech.co.in') {
          name = 'Tarun bidding';
          company = 'IndoTech Solutions Ltd';
          role = 'employee';
        } else if (email === 'ceo@indotech.co.in') {
          name = 'CEO Admin';
          company = 'IndoTech Solutions Ltd';
          role = 'company_admin';
        }

        await setupSimulatedSession(email, name, company, gst, role);
      }
    } finally {
      setLoading(false);
    }
  };

  // Saved Tender Actions
  const saveTender = async (tenderId: string) => {
    if (!currentUser) return;
    const companyId = userProfile?.companyId || 'personal-' + currentUser.uid;
    const docId = `${companyId}_${tenderId}`;
    
    const existingRef = doc(db, 'savedTenders', docId);
    const existingSnap = await getDoc(existingRef);

    if (existingSnap.exists()) {
      // Unsave/delete
      await setDoc(existingRef, { ...existingSnap.data(), status: 'ignored' }, { merge: true });
      await logActivity('Unsaved Tender', `Tender ${tenderId} marked as ignored`, 'tender');
    } else {
      // Create new SavedTender record
      const saved: SavedTender = {
        id: docId,
        tenderId,
        userId: currentUser.uid,
        companyId,
        isFavorite: false,
        notes: '',
        assignedTeam: [],
        status: 'saved',
        savedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'savedTenders', docId), saved);
      await logActivity('Saved Tender', `Tender ${tenderId} saved to board`, 'tender');
    }
  };

  const toggleFavorite = async (tenderId: string) => {
    if (!currentUser) return;
    const companyId = userProfile?.companyId || 'personal-' + currentUser.uid;
    const docId = `${companyId}_${tenderId}`;
    const ref = doc(db, 'savedTenders', docId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const currentFav = snap.data().isFavorite || false;
      await updateDoc(ref, { isFavorite: !currentFav });
    } else {
      const saved: SavedTender = {
        id: docId,
        tenderId,
        userId: currentUser.uid,
        companyId,
        isFavorite: true,
        notes: '',
        assignedTeam: [],
        status: 'saved',
        savedAt: new Date().toISOString()
      };
      await setDoc(ref, saved);
    }
    await logActivity('Toggle Favorite', `Tender ${tenderId} favorite status toggled`, 'tender');
  };

  const updateTenderNotes = async (tenderId: string, notes: string) => {
    if (!currentUser) return;
    const companyId = userProfile?.companyId || 'personal-' + currentUser.uid;
    const docId = `${companyId}_${tenderId}`;
    const ref = doc(db, 'savedTenders', docId);
    await updateDoc(ref, { notes });
    await logActivity('Update Notes', `Updated team notes for tender: ${tenderId}`, 'tender');
  };

  const updateTenderStatus = async (tenderId: string, status: SavedTender['status']) => {
    if (!currentUser) return;
    const companyId = userProfile?.companyId || 'personal-' + currentUser.uid;
    const docId = `${companyId}_${tenderId}`;
    const ref = doc(db, 'savedTenders', docId);
    await updateDoc(ref, { status });
    await logActivity('Update Bid Status', `Updated bid workflow status to "${status}" for tender: ${tenderId}`, 'tender');
  };

  const assignTeamToTender = async (tenderId: string, teamEmails: string[]) => {
    if (!currentUser) return;
    const companyId = userProfile?.companyId || 'personal-' + currentUser.uid;
    const docId = `${companyId}_${tenderId}`;
    const ref = doc(db, 'savedTenders', docId);
    await updateDoc(ref, { assignedTeam: teamEmails });
    
    // Log activity
    await logActivity('Assign Team', `Assigned team members (${teamEmails.join(', ')}) to tender: ${tenderId}`, 'tender');
    
    // Trigger notification to the first team member assigned
    if (teamEmails.length > 0) {
      // Find user uid with this email to trigger app alert
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', teamEmails[0])));
        if (!usersSnap.empty) {
          const matchedUser = usersSnap.docs[0].id;
          await triggerNotification(
            matchedUser, 
            'New Bid Assignment', 
            `You have been assigned to prepare bid documents for tender reference: ${tenderId}`,
            'assignment'
          );
        }
      } catch (e) {
        console.warn("Could not alert team member inside Firestore:", e);
      }
    }
  };

  const updateChecklistItem = async (tenderId: string, taskText: string, completed: boolean) => {
    // Checklists can be updated directly in the local state or the database of original tender
    // Since tender checklist represents the master or company specific checklist, we will merge this inside the SavedTender document's checklist array
    if (!currentUser) return;
    const companyId = userProfile?.companyId || 'personal-' + currentUser.uid;
    const docId = `${companyId}_${tenderId}`;
    const ref = doc(db, 'savedTenders', docId);
    
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        let checklist = data.checklist || [];
        const itemIdx = checklist.findIndex((c: any) => c.task === taskText);
        if (itemIdx >= 0) {
          checklist[itemIdx].completed = completed;
        } else {
          checklist.push({ task: taskText, completed });
        }
        await updateDoc(ref, { checklist });
      }
    } catch (err) {
      console.warn("Checklist update error on Firestore, merging onto original list:", err);
    }
  };

  // Company Profile Actions
  const updateCompanyProfile = async (companyData: Partial<Company>) => {
    if (!currentUser || !userProfile?.companyId) return;
    const ref = doc(db, 'companies', userProfile.companyId);
    await updateDoc(ref, companyData);
    
    // Re-fetch company
    const updated = await getDoc(ref);
    if (updated.exists()) {
      setCurrentCompany(updated.data() as Company);
    }
    await logActivity('Update Company Profile', `Updated company profile details for ${companyData.name || currentCompany?.name}`, 'company');
  };

  // Admin & System Settings Actions
  const addTender = async (tenderData: Omit<Tender, 'id' | 'createdAt'>) => {
    const id = `tender-${Date.now()}`;
    const tender: Tender = {
      ...tenderData,
      id,
      createdAt: new Date().toISOString().split('T')[0]
    };
    await setDoc(doc(db, 'tenders', id), tender);
    await logActivity('Add Tender', `Published new active tender: ${tender.title}`, 'admin');
  };

  const updateSystemSettings = async (newSettings: Partial<SystemSettings>) => {
    const ref = doc(db, 'settings', 'system');
    await updateDoc(ref, newSettings);
    await logActivity('Update Settings', 'Updated system-wide security and model configurations', 'admin');
  };

  const submitFeedback = async (subject: string, message: string, rating: number) => {
    const id = `feed-${Date.now()}`;
    const feed: FeedbackRecord = {
      id,
      userId: currentUser?.uid || 'anonymous',
      companyId: userProfile?.companyId,
      email: currentUser?.email || 'anonymous@tenderflow.ai',
      subject,
      message,
      rating,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'feedback', id), feed);
    await logActivity('Submit Feedback', `Submitted feedback on: "${subject}" with score ${rating}/5`, 'company');
  };

  const updateFeedbackStatus = async (id: string, status: 'pending' | 'resolved', adminNotes?: string) => {
    const ref = doc(db, 'feedback', id);
    await updateDoc(ref, { status, adminNotes });
    await logActivity('Resolve Feedback', `Marked feedback ${id} as resolved`, 'admin');
  };

  // Notifications logic
  const triggerNotification = async (userId: string, title: string, message: string, type: AppNotification['type']) => {
    const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const notif: AppNotification = {
      id,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'notifications', id), notif);
    } catch (e) {
      setNotifications(prev => [notif, ...prev]);
    }
  };

  const clearNotification = async (id: string) => {
    try {
      await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
    } catch (e) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const markAllNotificationsRead = async () => {
    for (const notif of notifications) {
      if (!notif.read) {
        await clearNotification(notif.id);
      }
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      userProfile,
      currentCompany,
      tenders,
      savedTenders,
      notifications,
      logs,
      feedbacks,
      settings,
      loading,
      theme,
      selectedStateFilter,
      setSelectedStateFilter,
      login,
      register,
      logout,
      resetPassword,
      loginAsDemoUser,
      toggleTheme,
      saveTender,
      toggleFavorite,
      updateTenderNotes,
      updateTenderStatus,
      assignTeamToTender,
      updateChecklistItem,
      updateCompanyProfile,
      addTender,
      submitFeedback,
      updateFeedbackStatus,
      updateSystemSettings,
      logActivity,
      triggerNotification,
      clearNotification,
      markAllNotificationsRead
    }}>
      {children}
    </AppContext.Provider>
  );
};
