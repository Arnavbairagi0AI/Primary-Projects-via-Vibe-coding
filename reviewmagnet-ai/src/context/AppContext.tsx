import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  onSnapshot
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { UserProfile, Review, PaymentTransaction, SubscriptionStatus, UserRole } from "../types";

interface AppContextType {
  user: UserProfile | null;
  loading: boolean;
  reviews: Review[];
  payments: PaymentTransaction[];
  reviewsLoading: boolean;
  paymentsLoading: boolean;
  signUpUser: (email: string, password: string, businessName: string, googleBusinessUrl: string, role: UserRole) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  generateReviewReply: (reviewId: string) => Promise<void>;
  updateReviewReplyText: (reviewId: string, text: string) => Promise<void>;
  postReviewReply: (reviewId: string, text: string) => Promise<void>;
  submitPaymentRequest: (upiTransactionId: string, amount: number) => Promise<void>;
  refreshReviews: () => Promise<void>;
  refreshPayments: () => Promise<void>;
  addMockSampleReviews: () => Promise<void>;
  adminApprovePayment: (paymentId: string, targetUserId: string) => Promise<void>;
  updateBusinessDetails: (businessName: string, googleBusinessUrl: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
}

const DEFAULT_GUEST_USER: UserProfile = {
  uid: "neoedits2008-main-owner",
  email: "neoedits2008@gmail.com",
  businessName: "ReviewMagnet HQ (Main Owner)",
  googleBusinessUrl: "https://g.page/r/reviewmagnet/review",
  subscriptionStatus: "Active",
  role: "Admin",
  isSystemOwner: true,
  isSystemTester: true
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(DEFAULT_GUEST_USER);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Initial Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          const email = firebaseUser.email || "neoedits2008@gmail.com";

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            const updatedData = {
              ...data,
              role: "Admin" as UserRole,
              subscriptionStatus: "Active" as SubscriptionStatus,
              isSystemOwner: true,
              isSystemTester: true
            };
            await setDoc(userDocRef, updatedData, { merge: true });
            setUser({
              uid: firebaseUser.uid,
              email,
              ...updatedData
            } as UserProfile);
          } else {
            // First time login for Google/Apple, or fallback registration profile
            const userProfile = {
              email: email,
              businessName: "ReviewMagnet HQ (Main Owner)",
              googleBusinessUrl: "",
              subscriptionStatus: "Active" as SubscriptionStatus,
              role: "Admin" as UserRole,
              isSystemOwner: true,
              isSystemTester: true
            };
            await setDoc(userDocRef, userProfile);
            setUser({
              uid: firebaseUser.uid,
              ...userProfile
            } as UserProfile);
            addMockSampleReviewsForId(firebaseUser.uid, userProfile.businessName).catch(console.error);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          setUser(DEFAULT_GUEST_USER);
        }
      } else {
        setUser(DEFAULT_GUEST_USER);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync reviews and payments in real-time when user logged in
  useEffect(() => {
    if (!user) return;

    setReviewsLoading(true);
    setPaymentsLoading(true);

    let unsubscribeReviews: () => void;
    let unsubscribePayments: () => void;

    try {
      // 1. Subscribe to Reviews
      const reviewsRef = collection(db, "reviews");
      // If Admin/Staff, query by matching business user ID
      const rQuery = query(reviewsRef, where("userId", "==", user.uid));
      unsubscribeReviews = onSnapshot(rQuery, (snapshot) => {
        if (snapshot.empty) {
          addMockSampleReviewsForId(user.uid, user.businessName).catch(console.error);
        }
        const fetchedReviews: Review[] = [];
        snapshot.forEach((doc) => {
          fetchedReviews.push({ id: doc.id, ...doc.data() } as Review);
        });
        // Sort newest first
        fetchedReviews.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setReviews(fetchedReviews);
        setReviewsLoading(false);
      }, (error) => {
        console.error("Reviews listener error:", error);
        setReviewsLoading(false);
      });

      // 2. Subscribe to Payments
      const paymentsRef = collection(db, "payments");
      // Admin gets own payments, Super Admin or admin profile gets to see pending list
      // For simplicity in SaaS, we retrieve the payments corresponding to this business
      let pQuery = query(paymentsRef, where("userId", "==", user.uid));
      // If user is Admin, they can also see other payments if needed, but they see theirs.
      unsubscribePayments = onSnapshot(pQuery, (snapshot) => {
        const fetchedPayments: PaymentTransaction[] = [];
        snapshot.forEach((doc) => {
          fetchedPayments.push({ id: doc.id, ...doc.data() } as PaymentTransaction);
        });
        fetchedPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
        setPayments(fetchedPayments);
        setPaymentsLoading(false);
      }, (error) => {
        console.error("Payments listener error:", error);
        setPaymentsLoading(false);
      });

    } catch (e) {
      console.error("Error setting up listeners:", e);
      setReviewsLoading(false);
      setPaymentsLoading(false);
    }

    return () => {
      if (unsubscribeReviews) unsubscribeReviews();
      if (unsubscribePayments) unsubscribePayments();
    };
  }, [user?.uid]);

  // Sign up action
  const signUpUser = async (
    email: string, 
    password: string, 
    businessName: string, 
    googleBusinessUrl: string,
    role: UserRole
  ) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Create profile document in Firestore
      const userProfile: Omit<UserProfile, 'uid'> = {
        email,
        businessName,
        googleBusinessUrl,
        subscriptionStatus: "Trial",
        role
      };

      await setDoc(doc(db, "users", uid), userProfile);
      
      setUser({
        uid,
        ...userProfile
      });

      // Populate dummy mock reviews in the background so dashboard is beautiful and ready
      addMockSampleReviewsForId(uid, businessName).catch(console.error);

    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  // Sign in action
  const loginUser = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  // Sign out action
  const logoutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Pre-populate mock reviews helper
  const addMockSampleReviewsForId = async (userId: string, businessName: string) => {
    const sampleReviews = [
      {
        reviewerName: "Aarav Sharma",
        rating: 5,
        reviewText: "Exceptional service! The staff was incredibly professional and completed our request beautifully and ahead of schedule. Highly recommend to everyone in the area!",
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), // 4 hrs ago
        aiReplyStatus: "Pending",
        generatedReplyText: "",
        userId
      },
      {
        reviewerName: "Priya Patel",
        rating: 2,
        reviewText: "The waiting time is extremely long and unreasonable. I had to wait for over 45 minutes just to get someone's attention, and when they finally assisted me, they seemed too rushed and uncaring.",
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
        aiReplyStatus: "Pending",
        generatedReplyText: "",
        userId
      },
      {
        reviewerName: "Rohan Das",
        rating: 4,
        reviewText: "Overall really great experience! The quality of the deliverables is outstanding. Just a minor communication delay early on, but they completely made up for it. I will definitely be a returning customer.",
        timestamp: new Date(Date.now() - 48 * 3600000).toISOString(), // 2 days ago
        aiReplyStatus: "Pending",
        generatedReplyText: "",
        userId
      },
      {
        reviewerName: "Ananya Iyer",
        rating: 1,
        reviewText: "Incredibly disappointed. The unit we purchased broke down within 24 hours. I tried calling customer support three times and got no response. Horrible service!",
        timestamp: new Date(Date.now() - 72 * 3600000).toISOString(), // 3 days ago
        aiReplyStatus: "Pending",
        generatedReplyText: "",
        userId
      },
      {
        reviewerName: "Vikram Malhotra",
        rating: 3,
        reviewText: "Decent work and friendly staff, but the pricing is on the higher side compared to other competitors in the neighborhood. Good but nothing extraordinary.",
        timestamp: new Date(Date.now() - 120 * 3600000).toISOString(), // 5 days ago
        aiReplyStatus: "Pending",
        generatedReplyText: "",
        userId
      }
    ];

    try {
      const reviewsRef = collection(db, "reviews");
      await Promise.all(sampleReviews.map(review => addDoc(reviewsRef, review)));
    } catch (e) {
      console.error("Error creating mock reviews:", e);
    }
  };

  const addMockSampleReviews = async () => {
    if (!user) return;
    await addMockSampleReviewsForId(user.uid, user.businessName);
  };

  // Generate AI reply using our secure full-stack backend
  const generateReviewReply = async (reviewId: string) => {
    if (!user) return;
    
    // Find review in local list first
    const targetReview = reviews.find(r => r.id === reviewId);
    if (!targetReview) return;

    try {
      // Optimistic update
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, aiReplyStatus: "Generated" as const, generatedReplyText: "Generating with Gemini AI..." } : r));

      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reviewerName: targetReview.reviewerName,
          rating: targetReview.rating,
          reviewText: targetReview.reviewText,
          businessName: user.businessName,
          businessType: "Local Business"
        })
      });

      if (!res.ok) {
        throw new Error("Backend API call failed");
      }

      const data = await res.json();
      const replyText = data.reply || "Thank you for your valuable feedback!";

      // Update Firestore
      const reviewDocRef = doc(db, "reviews", reviewId);
      await updateDoc(reviewDocRef, {
        aiReplyStatus: "Generated",
        generatedReplyText: replyText
      });

    } catch (error) {
      console.error("Error generating reply:", error);
      // Fallback
      const reviewDocRef = doc(db, "reviews", reviewId);
      await updateDoc(reviewDocRef, {
        aiReplyStatus: "Generated",
        generatedReplyText: `Hi ${targetReview.reviewerName}, thank you for your review. We appreciate you taking the time to share your thoughts with us!`
      });
    }
  };

  // Manually update/tweak the reply text
  const updateReviewReplyText = async (reviewId: string, text: string) => {
    try {
      const reviewDocRef = doc(db, "reviews", reviewId);
      await updateDoc(reviewDocRef, {
        generatedReplyText: text
      });
    } catch (error) {
      console.error("Error updating reply text in database:", error);
    }
  };

  // Post response and lock state
  const postReviewReply = async (reviewId: string, text: string) => {
    try {
      const reviewDocRef = doc(db, "reviews", reviewId);
      await updateDoc(reviewDocRef, {
        aiReplyStatus: "Posted",
        generatedReplyText: text
      });
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };

  // Submit payment request
  const submitPaymentRequest = async (upiTransactionId: string, amount: number) => {
    if (!user) return;
    try {
      const paymentsRef = collection(db, "payments");
      await addDoc(paymentsRef, {
        userId: user.uid,
        businessName: user.businessName,
        amount,
        paymentDate: new Date().toISOString(),
        upiTransactionId,
        confirmationStatus: "Pending"
      });
    } catch (error) {
      console.error("Error submitting payment:", error);
      throw error;
    }
  };

  // Update business info
  const updateBusinessDetails = async (businessName: string, googleBusinessUrl: string) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        businessName,
        googleBusinessUrl
      });
      setUser(prev => prev ? { ...prev, businessName, googleBusinessUrl } : null);
    } catch (error) {
      console.error("Error updating business details:", error);
      throw error;
    }
  };

  // Admin approves payment and upgrades account subscription to Active
  const adminApprovePayment = async (paymentId: string, targetUserId: string) => {
    try {
      // 1. Update payment status to Approved
      const paymentDocRef = doc(db, "payments", paymentId);
      await updateDoc(paymentDocRef, {
        confirmationStatus: "Approved"
      });

      // 2. Update target user subscription status to Active
      const userDocRef = doc(db, "users", targetUserId);
      await updateDoc(userDocRef, {
        subscriptionStatus: "Active"
      });

      // If the current logged in user was the upgraded user, update state too
      if (user && user.uid === targetUserId) {
        setUser(prev => prev ? { ...prev, subscriptionStatus: "Active" } : null);
      }
    } catch (error) {
      console.error("Admin approval error:", error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithApple = async () => {
    setLoading(true);
    try {
      const provider = new OAuthProvider("apple.com");
      await signInWithPopup(auth, provider);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Explicit refetches (optional helper)
  const refreshReviews = async () => {};
  const refreshPayments = async () => {};

  return (
    <AppContext.Provider value={{
      user,
      loading,
      reviews,
      payments,
      reviewsLoading,
      paymentsLoading,
      signUpUser,
      loginUser,
      logoutUser,
      generateReviewReply,
      updateReviewReplyText,
      postReviewReply,
      submitPaymentRequest,
      refreshReviews,
      refreshPayments,
      addMockSampleReviews,
      adminApprovePayment,
      updateBusinessDetails,
      loginWithGoogle,
      loginWithApple
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
