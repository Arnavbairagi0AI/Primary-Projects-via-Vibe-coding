export type UserRole = 'super_admin' | 'company_admin' | 'employee';

export type SubscriptionPlan = 'free_trial' | 'starter' | 'business' | 'enterprise';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyId?: string;
  createdAt: string;
  emailVerified: boolean;
  status: 'active' | 'suspended';
}

export interface Company {
  id: string;
  name: string;
  gstNumber: string;
  industry: string;
  keywords: string[];
  states: string[];
  categories: string[];
  previousProjects: { title: string; client: string; value: number; year: number }[];
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: 'active' | 'cancelled' | 'expired' | 'trialing';
  subscriptionId?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: 'company_admin' | 'employee';
  status: 'active' | 'invited' | 'inactive';
  joinedAt: string;
}

export interface Tender {
  id: string;
  title: string;
  refNo: string;
  authority: string;
  department: string;
  state: string;
  city: string;
  category: string;
  value: number; // in INR (Rupees)
  deadline: string; // ISO date string
  docUrl?: string;
  status: 'active' | 'closed' | 'archived';
  createdAt: string;
  
  // AI Enhanced Fields (Lazy loaded or populated)
  aiSummarized?: string;
  aiEligibility?: string[];
  aiRequiredDocs?: string[];
  aiTechnicalTerms?: { term: string; explanation: string }[];
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  aiChecklist?: { task: string; completed: boolean }[];
  aiRecommendation?: {
    shouldApply: 'yes' | 'no' | 'maybe';
    reason: string;
    score: number; // 0-100 match score
  };
}

export interface SavedTender {
  id: string;
  tenderId: string;
  userId: string;
  companyId: string;
  isFavorite: boolean;
  notes: string;
  assignedTeam: string[]; // List of employee emails/uids
  status: 'saved' | 'interested' | 'preparing' | 'submitted' | 'won' | 'lost' | 'ignored';
  savedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'deadline' | 'system' | 'recommendation' | 'assignment';
  read: boolean;
  createdAt: string;
}

export interface SubscriptionDetail {
  id: string;
  companyId: string;
  plan: SubscriptionPlan;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  status: 'active' | 'cancelled' | 'expired' | 'trialing';
}

export interface PaymentRecord {
  id: string;
  companyId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  paymentMethod: string;
  transactionId: string;
  timestamp: string;
}

export interface SystemSettings {
  id: string;
  allowNewRegistrations: boolean;
  aiModelVersion: string;
  maintenanceMode: boolean;
  supportEmail: string;
  enableEmailAlerts: boolean;
  dailyDigestTime: string;
}

export interface FeedbackRecord {
  id: string;
  userId: string;
  companyId?: string;
  email: string;
  subject: string;
  message: string;
  rating: number; // 1-5
  status: 'pending' | 'resolved';
  createdAt: string;
  adminNotes?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  detail: string;
  category: 'auth' | 'tender' | 'company' | 'admin' | 'billing';
  timestamp: string;
}
