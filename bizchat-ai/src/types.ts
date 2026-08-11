export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'business';
  plan: 'free' | 'pro' | 'business';
  shopName?: string;
}

export interface BusinessSettings {
  shopName: string;
  address: string;
  phone: string;
  workingHours: string;
  logoUrl?: string;
  // AI Settings
  aiPersonality: string;
  language: string;
  greetingMessage: string;
  customInstructions: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl?: string;
  available: boolean;
  createdAt: number;
}

export type OrderStatus = 'New' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  lastConversation: string;
  notes: string;
  tags: string[];
}

export interface Message {
  id: string;
  sender: 'customer' | 'ai' | 'agent';
  text: string;
  timestamp: number;
  rating?: 'like' | 'dislike';
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  lastMessage: string;
  lastMessageTime: number;
  messages: Message[];
  status: 'active' | 'archived';
  unreadCount: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
}
