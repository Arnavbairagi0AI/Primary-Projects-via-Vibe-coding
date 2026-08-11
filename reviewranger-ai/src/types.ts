export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isActiveSubscription: boolean;
  businessName?: string;
  trialCount?: number;
  createdAt: string;
}

export interface GeneratedReply {
  text: string;
  seoKeywords: string[];
  explanation: string;
}

export interface HistoryItem {
  id?: string;
  userId: string;
  customerReview: string;
  language: string;
  replyTone: string;
  generatedReplies: GeneratedReply[];
  selectedReplyText?: string;
  businessName?: string;
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  createdAt: string;
}

export type TabType = 'dashboard' | 'generator' | 'history' | 'billing';
