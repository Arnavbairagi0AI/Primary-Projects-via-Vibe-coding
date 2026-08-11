export interface Message {
  sender: 'system' | 'customer';
  text: string;
  timestamp: string;
}

export interface MissedCall {
  id: string;
  callId: string;
  customerPhone: string;
  timestamp: string;
  status: 'Missed' | 'Auto-Reply Sent' | 'Customer Engaged' | 'Resolved';
  logs: Message[];
  notes: string;
  ownerId: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  businessName: string;
  phoneNumber: string;
  role: 'Admin' | 'Staff';
  subscriptionStatus: 'Active' | 'Trial' | 'Expired';
  calendarSlots: string[]; // Active booking slots, e.g., ["09:00 AM", "10:30 AM", "02:00 PM"]
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  upiTransactionId: string;
  confirmationStatus: 'Pending' | 'Approved';
  userId: string;
}

export interface Booking {
  id: string;
  businessId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookingDate: string;
  bookingTime: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
}
