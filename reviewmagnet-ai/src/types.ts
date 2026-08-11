export type SubscriptionStatus = "Active" | "Trial" | "Expired";
export type UserRole = "Admin" | "Staff";
export type AiReplyStatus = "Pending" | "Generated" | "Posted";
export type PaymentStatus = "Pending" | "Approved";

export interface UserProfile {
  uid: string;
  email: string;
  businessName: string;
  googleBusinessUrl: string;
  subscriptionStatus: SubscriptionStatus;
  role: UserRole;
  isSystemOwner?: boolean;
  isSystemTester?: boolean;
}

export interface Review {
  id: string;
  userId: string;
  reviewerName: string;
  rating: number; // 1 to 5 stars
  reviewText: string;
  timestamp: string; // ISO String or display date
  aiReplyStatus: AiReplyStatus;
  generatedReplyText: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  businessName: string;
  amount: number;
  paymentDate: string;
  upiTransactionId: string;
  confirmationStatus: PaymentStatus;
}
