import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, MissedCall, Payment, Booking, Message } from '../types';

interface AppContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  missedCalls: MissedCall[];
  payments: Payment[];
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, businessName: string, phoneNumber: string, role: 'Admin' | 'Staff') => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateMissedCallStatus: (id: string, status: MissedCall['status'], notes?: string) => Promise<void>;
  updateMissedCallNotes: (id: string, notes: string) => Promise<void>;
  addPayment: (amount: number, upiTransactionId: string) => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id' | 'status'>) => Promise<void>;
  updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>;
  simulateNewIncomingCall: (phoneNumber?: string) => Promise<void>;
  sendSimulatedCustomerMessage: (callId: string, messageText: string) => Promise<void>;
  clearError: () => void;
}

const GUEST_PROFILE: UserProfile = {
  uid: 'guest_unrestricted_user',
  email: 'guest@missedcall.ai',
  businessName: 'My Business (Free Access)',
  phoneNumber: '+91 98765 43210',
  role: 'Admin',
  subscriptionStatus: 'Active',
  calendarSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(GUEST_PROFILE);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [missedCalls, setMissedCalls] = useState<MissedCall[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const clearError = () => setError(null);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            // Always grant Active full status to everyone
            if (data.subscriptionStatus !== 'Active') {
              data.subscriptionStatus = 'Active';
              await setDoc(doc(db, 'users', fbUser.uid), { subscriptionStatus: 'Active' }, { merge: true });
            }
            setUser(data);
          } else {
            // Fallback profile with Active status
            const fallbackProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              businessName: fbUser.displayName || 'My Business',
              phoneNumber: fbUser.phoneNumber || '',
              role: 'Admin',
              subscriptionStatus: 'Active',
              calendarSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
            };
            await setDoc(doc(db, 'users', fbUser.uid), fallbackProfile);
            setUser(fallbackProfile);
          }
        } catch (err: any) {
          console.error("Error fetching user profile:", err);
          setError(err.message || 'Failed to fetch profile.');
        }
      } else {
        setFirebaseUser(null);
        setUser(GUEST_PROFILE);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Listeners for Firestore Data (active for both logged-in users and guests)
  useEffect(() => {
    const activeUid = firebaseUser ? firebaseUser.uid : (user?.uid || 'guest_unrestricted_user');

    // Listen to Missed Calls
    const qCalls = query(
      collection(db, 'missed_calls'),
      where('ownerId', '==', activeUid)
    );
    const unsubCalls = onSnapshot(qCalls, (snapshot) => {
      const calls: MissedCall[] = [];
      snapshot.forEach((doc) => {
        calls.push({ id: doc.id, ...doc.data() } as MissedCall);
      });

      if (calls.length === 0 && activeUid === 'guest_unrestricted_user') {
        // Automatically seed demo data for guest user on first load
        seedMockData('guest_unrestricted_user', 'My Business (Free Access)');
      } else {
        calls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setMissedCalls(calls);
      }
    }, (err) => {
      console.error("Error listening to missed calls:", err);
    });

    // Listen to Payments
    const qPayments = query(
      collection(db, 'payments'),
      where('userId', '==', activeUid)
    );
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const payList: Payment[] = [];
      snapshot.forEach((doc) => {
        payList.push({ id: doc.id, ...doc.data() } as Payment);
      });
      payList.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      setPayments(payList);
    }, (err) => {
      console.error("Error listening to payments:", err);
    });

    // Listen to Bookings
    const qBookings = query(
      collection(db, 'bookings'),
      where('businessId', '==', activeUid)
    );
    const unsubBookings = onSnapshot(qBookings, (snapshot) => {
      const bookList: Booking[] = [];
      snapshot.forEach((doc) => {
        bookList.push({ id: doc.id, ...doc.data() } as Booking);
      });
      bookList.sort((a, b) => {
        const dateCompare = new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.bookingTime.localeCompare(b.bookingTime);
      });
      setBookings(bookList);
    }, (err) => {
      console.error("Error listening to bookings:", err);
    });

    return () => {
      unsubCalls();
      unsubPayments();
      unsubBookings();
    };
  }, [firebaseUser, user?.uid]);

  // Seeding Initial High-Fidelity Simulator Data on Signup
  const seedMockData = async (uid: string, businessName: string) => {
    try {
      const callCollectionRef = collection(db, 'missed_calls');
      
      const mockCalls: Omit<MissedCall, 'id'>[] = [
        {
          callId: 'MC-' + Math.floor(1000 + Math.random() * 9000),
          customerPhone: '+91 98765 43210',
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
          status: 'Customer Engaged',
          notes: 'Customer looking for Saturday slot. AI responded.',
          ownerId: uid,
          logs: [
            {
              sender: 'system',
              text: `Hi! Thank you for calling ${businessName}. Sorry we missed your call. We're currently assisting other customers. How can we help you today? You can also book directly using our calendar: /book/${uid}`,
              timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString()
            },
            {
              sender: 'customer',
              text: 'Hi, I need to book an appointment for this Saturday. Do you have anything around 10:00 AM?',
              timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString()
            },
            {
              sender: 'system',
              text: 'Yes! We have a slot open at 10:00 AM this Saturday. I have provisionally reserved it for you. Please click the link to confirm your details: /book/' + uid,
              timestamp: new Date(Date.now() - 21 * 60 * 1000).toISOString()
            }
          ]
        },
        {
          callId: 'MC-' + Math.floor(1000 + Math.random() * 9000),
          customerPhone: '+91 81234 56789',
          timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
          status: 'Resolved',
          notes: 'Appointment confirmed & auto-synced into booking list.',
          ownerId: uid,
          logs: [
            {
              sender: 'system',
              text: `Hi! Thank you for calling ${businessName}. Sorry we missed you. Would you like to check out our calendar or ask any questions? Link: /book/${uid}`,
              timestamp: new Date(Date.now() - 119 * 60 * 1000).toISOString()
            },
            {
              sender: 'customer',
              text: 'Thanks! I just wanted to book an appointment. I will use the link.',
              timestamp: new Date(Date.now() - 118 * 60 * 1000).toISOString()
            },
            {
              sender: 'system',
              text: 'Awesome! Let me know if you face any issues. Looking forward to serving you!',
              timestamp: new Date(Date.now() - 117 * 60 * 1000).toISOString()
            }
          ]
        },
        {
          callId: 'MC-' + Math.floor(1000 + Math.random() * 9000),
          customerPhone: '+91 70123 45678',
          timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), // 5 hours ago
          status: 'Auto-Reply Sent',
          notes: 'Auto-reply SMS sent immediately. Waiting for customer response.',
          ownerId: uid,
          logs: [
            {
              sender: 'system',
              text: `Hello! This is ${businessName}. We saw we missed a call from you. We apologize! Is there anything we can help you with? Feel free to book an appointment instantly: /book/${uid}`,
              timestamp: new Date(Date.now() - 4.9 * 3600 * 1000).toISOString()
            }
          ]
        },
        {
          callId: 'MC-' + Math.floor(1000 + Math.random() * 9000),
          customerPhone: '+91 90000 11122',
          timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 mins ago
          status: 'Missed',
          notes: 'New missed call. Auto-reply pending configuration or triggers.',
          ownerId: uid,
          logs: []
        }
      ];

      const promises = mockCalls.map(call => addDoc(callCollectionRef, call));

      // Add a confirmed booking in parallel
      promises.push(
        addDoc(collection(db, 'bookings'), {
          businessId: uid,
          customerName: 'Rahul Sharma',
          customerPhone: '+91 98765 43210',
          customerEmail: 'rahul.sharma@example.com',
          bookingDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0], // tomorrow
          bookingTime: '10:00 AM',
          status: 'Confirmed'
        })
      );

      await Promise.all(promises);

    } catch (err) {
      console.error("Error seeding initial data:", err);
    }
  };

  // 3. Authentication Operations
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
      setLoading(false);
      throw err;
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    businessName: string, 
    phoneNumber: string, 
    role: 'Admin' | 'Staff'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;
      
      const profile: UserProfile = {
        uid,
        email,
        businessName,
        phoneNumber,
        role,
        subscriptionStatus: 'Active', // Full access for life for everyone
        calendarSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
      };

      await setDoc(doc(db, 'users', uid), profile);
      setUser(profile);
      
      // Seed high quality demo data in the background (non-blocking)
      seedMockData(uid, businessName);

    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
      setLoading(false);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const fbUser = credential.user;
      
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const businessName = fbUser.displayName || 'My Business';
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          businessName,
          phoneNumber: fbUser.phoneNumber || '',
          role: 'Admin',
          subscriptionStatus: 'Active',
          calendarSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
        };
        await setDoc(userDocRef, profile);
        setUser(profile);
        // Seed high quality demo data in the background (non-blocking)
        seedMockData(fbUser.uid, businessName);
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setError(err.message || 'Failed to sign in with Google.');
      setLoading(false);
      throw err;
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out.');
    } finally {
      setFirebaseUser(null);
      setUser(GUEST_PROFILE);
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    setError(null);
    try {
      const updatedProfile = { ...user, ...updates };
      const activeUid = firebaseUser ? firebaseUser.uid : user.uid;
      if (firebaseUser) {
        await setDoc(doc(db, 'users', activeUid), updatedProfile, { merge: true });
      }
      setUser(updatedProfile);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
      throw err;
    }
  };

  // 4. Missed Call Operations
  const updateMissedCallStatus = async (id: string, status: MissedCall['status'], notes?: string) => {
    setError(null);
    try {
      const callDocRef = doc(db, 'missed_calls', id);
      const updates: any = { status };
      if (notes !== undefined) {
        updates.notes = notes;
      }
      await updateDoc(callDocRef, updates);
    } catch (err: any) {
      setError(err.message || 'Failed to update call status.');
    }
  };

  const updateMissedCallNotes = async (id: string, notes: string) => {
    setError(null);
    try {
      const callDocRef = doc(db, 'missed_calls', id);
      await updateDoc(callDocRef, { notes });
    } catch (err: any) {
      setError(err.message || 'Failed to update notes.');
    }
  };

  // 5. Payment Operations
  const addPayment = async (amount: number, upiTransactionId: string) => {
    const activeUid = firebaseUser ? firebaseUser.uid : (user?.uid || 'guest_unrestricted_user');
    setError(null);
    try {
      const newPayment = {
        amount,
        upiTransactionId,
        paymentDate: new Date().toISOString(),
        confirmationStatus: 'Approved',
        userId: activeUid
      };
      await addDoc(collection(db, 'payments'), newPayment);
    } catch (err: any) {
      setError(err.message || 'Failed to record payment.');
      throw err;
    }
  };

  // 6. Booking Operations
  const addBooking = async (booking: Omit<Booking, 'id' | 'status'>) => {
    setError(null);
    try {
      const newBooking = {
        ...booking,
        status: 'Confirmed'
      };
      await addDoc(collection(db, 'bookings'), newBooking);

      // Also automatically transition any matching missed call to "Resolved" and update notes
      const matchedCall = missedCalls.find(
        (c) => c.customerPhone.replace(/[\s+-]/g, '') === booking.customerPhone.replace(/[\s+-]/g, '')
      );
      if (matchedCall) {
        await updateMissedCallStatus(
          matchedCall.id, 
          'Resolved', 
          `Auto-resolved: Customer successfully booked appointment for ${booking.bookingDate} at ${booking.bookingTime}.`
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create booking.');
      throw err;
    }
  };

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    setError(null);
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
    } catch (err: any) {
      setError(err.message || 'Failed to update booking status.');
    }
  };

  // 7. Simulated Incoming Call (Interactive live demo)
  const simulateNewIncomingCall = async (phoneNumber?: string) => {
    const activeUser = user || GUEST_PROFILE;
    const activeUid = firebaseUser ? firebaseUser.uid : activeUser.uid;
    const phone = phoneNumber || '+91 ' + Math.floor(7000000000 + Math.random() * 2999999999);
    
    try {
      const newCall: Omit<MissedCall, 'id'> = {
        callId: 'MC-' + Math.floor(1000 + Math.random() * 9000),
        customerPhone: phone,
        timestamp: new Date().toISOString(),
        status: 'Missed',
        notes: 'Simulated missed call incoming.',
        ownerId: activeUid,
        logs: []
      };

      const docRef = await addDoc(collection(db, 'missed_calls'), newCall);

      // Wait 3 seconds, then automatically send an Auto-Reply text
      setTimeout(async () => {
        const welcomeMsg: Message = {
          sender: 'system',
          text: `Hi! Thank you for calling ${activeUser.businessName}. Sorry we missed you. Our AI representative is here to help! Would you like to book an appointment? Select a slot: /book/${activeUid}`,
          timestamp: new Date().toISOString()
        };
        await updateDoc(doc(db, 'missed_calls', docRef.id), {
          status: 'Auto-Reply Sent',
          logs: [welcomeMsg],
          notes: 'Auto-reply dispatched instantly via AI routing.'
        });
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to simulate incoming call.');
    }
  };

  // 8. Simulated Client Conversation Response (Customers typing in chat)
  const sendSimulatedCustomerMessage = async (callId: string, messageText: string) => {
    const activeUser = user || GUEST_PROFILE;
    const activeUid = firebaseUser ? firebaseUser.uid : activeUser.uid;
    try {
      const call = missedCalls.find(c => c.id === callId);
      if (!call) return;

      const customerMsg: Message = {
        sender: 'customer',
        text: messageText,
        timestamp: new Date().toISOString()
      };

      const updatedLogs = [...call.logs, customerMsg];
      const callDocRef = doc(db, 'missed_calls', callId);

      await updateDoc(callDocRef, {
        logs: updatedLogs,
        status: 'Customer Engaged'
      });

      // AI Automatically processes and answers after 2 seconds
      setTimeout(async () => {
        let responseText = `Thank you! Our system recorded that. You can view our available slots and instantly secure an appointment here: /book/${activeUid}`;
        const lowerText = messageText.toLowerCase();

        if (lowerText.includes('hi') || lowerText.includes('hello')) {
          responseText = `Hello! How can I assist you with ${activeUser.businessName} today? We have active slots available. Click here to schedule: /book/${activeUid}`;
        } else if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('rate')) {
          responseText = `Our standard plans and service pricing vary by requirements. I recommend scheduling a quick consult slot so we can quote you accurately: /book/${activeUid}`;
        } else if (lowerText.includes('where') || lowerText.includes('location') || lowerText.includes('address')) {
          responseText = `We are located in the heart of the business district. You can book an in-person appointment using our live scheduler: /book/${activeUid}`;
        } else if (lowerText.includes('timing') || lowerText.includes('open') || lowerText.includes('hours')) {
          responseText = `We are open Monday to Saturday from 9:00 AM to 6:00 PM. You can find all real-time open slots and book here: /book/${activeUid}`;
        }

        const systemMsg: Message = {
          sender: 'system',
          text: responseText,
          timestamp: new Date().toISOString()
        };

        const finalLogs = [...updatedLogs, systemMsg];
        await updateDoc(callDocRef, {
          logs: finalLogs
        });
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to send customer message simulation.');
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      firebaseUser,
      missedCalls,
      payments,
      bookings,
      loading,
      error,
      showAuthModal,
      setShowAuthModal,
      signIn,
      signUp,
      signInWithGoogle,
      signOutUser,
      updateProfile,
      updateMissedCallStatus,
      updateMissedCallNotes,
      addPayment,
      addBooking,
      updateBookingStatus,
      simulateNewIncomingCall,
      sendSimulatedCustomerMessage,
      clearError
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
