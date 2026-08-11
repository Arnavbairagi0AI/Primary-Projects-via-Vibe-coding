/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BusinessProfile {
  id: string;
  name: string;
  logoUrl?: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  businessHours: string;
  deliveryRadius: number; // in km
  languages: string[];
  gst?: string;
}

export interface Category {
  id: string;
  name: string;
  displayOrder: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  imageUrl?: string;
  price: number;
  isAvailable: boolean;
  description: string;
}

export interface TimelineEvent {
  status: 'new' | 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
  timestamp: string;
  note?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: 'new' | 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
  notes?: string;
  timeline: TimelineEvent[];
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  notes?: string;
  isRepeat: boolean;
  createdAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface AISettings {
  systemPrompt: string;
  knowledgeBase: string;
  faqs: FAQItem[];
  greetingMessage: string;
  tone: 'professional' | 'friendly' | 'helpful' | 'casual';
  languages: 'en' | 'hi' | 'both';
  autoReplyEnabled: boolean;
}

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl: string;
  status: 'connected' | 'disconnected';
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'ai' | 'human';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string; // usually customer's phone number
  customerPhone: string;
  customerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  takeoverMode: 'ai' | 'human';
  messages: ChatMessage[];
}

export interface SubscriptionPayment {
  id: string;
  amount: number;
  date: string;
  status: 'success' | 'failed';
  planId: 'trial' | 'starter' | 'pro' | 'premium';
}

export interface Subscription {
  planId: 'trial' | 'starter' | 'pro' | 'premium';
  status: 'active' | 'expired' | 'canceled';
  expiresAt: string;
  razorpaySubscriptionId?: string;
  payments: SubscriptionPayment[];
}
