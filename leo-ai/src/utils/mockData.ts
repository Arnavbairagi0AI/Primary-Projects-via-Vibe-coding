/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, writeBatch, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Category, 
  Product, 
  FAQItem, 
  AISettings, 
  Order, 
  Customer, 
  Conversation 
} from '../types';

export async function seedBusinessData(businessId: string, businessName: string) {
  const batch = writeBatch(db);

  // 1. Initial AI Settings
  const aiSettingsRef = doc(db, 'businesses', businessId, 'settings', 'ai');
  const initialAISettings: AISettings = {
    systemPrompt: `You are the digital manager of ${businessName}. You are polite, welcoming, and deeply knowledgeable about our products and services. Always help customers choose the best option, and collect their name and order preferences if they wish to buy.`,
    knowledgeBase: `${businessName} is a premium local business located at Sector 62, Noida. We pride ourselves on quick delivery within 5km, top-notch quality, and excellent customer service.
Delivery charges: ₹40 (Free for orders above ₹500).
Payment methods: GPay, PhonePe, Paytm, Cash on Delivery.`,
    faqs: [
      { id: 'faq1', question: 'What are your timings?', answer: 'We are open from 9:00 AM to 11:00 PM every day.' },
      { id: 'faq2', question: 'Do you deliver to my location?', answer: 'We deliver within a 5 km radius of Noida Sector 62.' },
      { id: 'faq3', question: 'How can I pay?', answer: 'We accept GPay, PhonePe, Paytm UPI, Card, and Cash on Delivery.' },
    ],
    greetingMessage: `Namaste! Welcome to ${businessName}. 🌸 I am Leo AI, your digital assistant. How can I help you today?`,
    tone: 'friendly',
    languages: 'both',
    autoReplyEnabled: true,
  };
  batch.set(aiSettingsRef, initialAISettings);

  // 2. Initial WhatsApp config
  const whatsappConfigRef = doc(db, 'businesses', businessId, 'settings', 'whatsapp');
  batch.set(whatsappConfigRef, {
    phoneNumberId: '1092837482910',
    accessToken: 'EAAGy...MOCK_TOKEN',
    verifyToken: 'leo_ai_secure_token_2026',
    webhookUrl: `https://api.leoai.saas/api/whatsapp/webhook/${businessId}`,
    status: 'connected',
  });

  // 3. Initial Categories
  const categories: Category[] = [
    { id: 'cat1', name: 'Best Sellers 🌟', displayOrder: 1 },
    { id: 'cat2', name: 'Main Course 🍛', displayOrder: 2 },
    { id: 'cat3', name: 'Drinks & Desserts 🥤', displayOrder: 3 },
  ];
  categories.forEach((cat) => {
    const ref = doc(db, 'businesses', businessId, 'categories', cat.id);
    batch.set(ref, cat);
  });

  // 4. Initial Products
  const products: Product[] = [
    { id: 'prod1', categoryId: 'cat1', name: 'Premium Butter Paneer Combo', price: 280, isAvailable: true, description: 'Delicious butter paneer masala served with 2 butter naans, jeera rice, salad and sweet.' },
    { id: 'prod2', categoryId: 'cat1', name: 'Signature Garlic Bread sticks', price: 150, isAvailable: true, description: 'Baked fresh with butter, garlic seasoning and cheese dip.' },
    { id: 'prod3', categoryId: 'cat2', name: 'Dal Makhani Special', price: 220, isAvailable: true, description: 'Slow-cooked black lentils with fresh cream and butter.' },
    { id: 'prod4', categoryId: 'cat2', name: 'Veg Dum Biryani', price: 240, isAvailable: true, description: 'Fragrant basmati rice layered with spiced vegetables, served with raita.' },
    { id: 'prod5', categoryId: 'cat3', name: 'Mango Lassi', price: 90, isAvailable: true, description: 'Thick, traditional mango-flavored sweet curd drink.' },
    { id: 'prod6', categoryId: 'cat3', name: 'Sizzling Chocolate Brownie', price: 180, isAvailable: false, description: 'Rich chocolate brownie served with vanilla ice cream and warm fudge.' },
  ];
  products.forEach((prod) => {
    const ref = doc(db, 'businesses', businessId, 'products', prod.id);
    batch.set(ref, prod);
  });

  // 5. Initial Customers
  const mockCustomers: Customer[] = [
    { id: 'cust1', name: 'Aarav Sharma', phone: '+91 98765 43210', orderCount: 5, totalSpent: 1450, isRepeat: true, notes: 'Prefers extra spicy. Always pays online.', createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
    { id: 'cust2', name: 'Ananya Goel', phone: '+91 87654 32109', orderCount: 2, totalSpent: 560, isRepeat: false, notes: 'Prefers no onion no garlic.', createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: 'cust3', name: 'Vikram Singh', phone: '+91 76543 21098', orderCount: 1, totalSpent: 330, isRepeat: false, notes: '', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  ];
  mockCustomers.forEach((cust) => {
    const ref = doc(db, 'businesses', businessId, 'customers', cust.id);
    batch.set(ref, cust);
  });

  // 6. Initial Orders
  const mockOrders: Order[] = [
    {
      id: 'ORD-1024',
      customerName: 'Aarav Sharma',
      customerPhone: '+91 98765 43210',
      items: [
        { productId: 'prod1', name: 'Premium Butter Paneer Combo', quantity: 2, price: 280 },
        { productId: 'prod5', name: 'Mango Lassi', quantity: 2, price: 90 },
      ],
      total: 740,
      status: 'delivered',
      notes: 'Please send extra mint chutney and keep paneer spicy.',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      timeline: [
        { status: 'new', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), note: 'Order placed via WhatsApp Assistant' },
        { status: 'confirmed', timestamp: new Date(Date.now() - 1.8 * 3600000).toISOString(), note: 'Business accepted order' },
        { status: 'preparing', timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(), note: 'In the kitchen' },
        { status: 'delivered', timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), note: 'Delivered by rider' },
      ],
    },
    {
      id: 'ORD-1025',
      customerName: 'Vikram Singh',
      customerPhone: '+91 76543 21098',
      items: [
        { productId: 'prod4', name: 'Veg Dum Biryani', quantity: 1, price: 240 },
        { productId: 'prod5', name: 'Mango Lassi', quantity: 1, price: 90 },
      ],
      total: 330,
      status: 'preparing',
      notes: 'Deliver hot.',
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      timeline: [
        { status: 'new', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), note: 'Order placed via WhatsApp Assistant' },
        { status: 'confirmed', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), note: 'Business auto-confirmed' },
        { status: 'preparing', timestamp: new Date(Date.now() - 20 * 60000).toISOString(), note: 'Preparing order' },
      ],
    },
    {
      id: 'ORD-1026',
      customerName: 'Ananya Goel',
      customerPhone: '+91 87654 32109',
      items: [
        { productId: 'prod2', name: 'Signature Garlic Bread sticks', quantity: 1, price: 150 },
      ],
      total: 150,
      status: 'new',
      notes: 'Leave at gate.',
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
      timeline: [
        { status: 'new', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), note: 'Order received via WhatsApp Chat' },
      ],
    },
  ];
  mockOrders.forEach((ord) => {
    const ref = doc(db, 'businesses', businessId, 'orders', ord.id);
    batch.set(ref, ord);
  });

  // 7. Initial Conversations
  const mockConversations: Conversation[] = [
    {
      id: '+919876543210',
      customerPhone: '+91 98765 43210',
      customerName: 'Aarav Sharma',
      lastMessage: 'Thank you! The paneer combo was amazing.',
      lastMessageAt: new Date(Date.now() - 45 * 60000).toISOString(),
      unreadCount: 0,
      takeoverMode: 'ai',
      messages: [
        { id: 'm1', sender: 'customer', text: 'Hi, are you open?', timestamp: new Date(Date.now() - 3 * 3600000).toISOString() },
        { id: 'm2', sender: 'ai', text: 'Namaste Aarav! Yes, we are open until 11:00 PM. Would you like to check our menu or order something?', timestamp: new Date(Date.now() - 2.9 * 3600000).toISOString() },
        { id: 'm3', sender: 'customer', text: 'I want to order Premium Butter Paneer Combo and Mango Lassi.', timestamp: new Date(Date.now() - 2.5 * 3600000).toISOString() },
        { id: 'm4', sender: 'ai', text: 'Perfect choice! I have created an order with 2x Butter Paneer Combo and 2x Mango Lassi. Total amount is ₹740. Please confirm your address and payment mode.', timestamp: new Date(Date.now() - 2.4 * 3600000).toISOString() },
        { id: 'm5', sender: 'customer', text: 'Address is Sector 62 H block. Cash on delivery please.', timestamp: new Date(Date.now() - 2.1 * 3600000).toISOString() },
        { id: 'm6', sender: 'ai', text: 'Done! Your order has been registered (ID: ORD-1024) and sent to our kitchen. We will deliver to Sector 62 shortly!', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
        { id: 'm7', sender: 'customer', text: 'Thank you! The paneer combo was amazing.', timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
      ],
    },
    {
      id: '+917654321098',
      customerPhone: '+91 76543 21098',
      customerName: 'Vikram Singh',
      lastMessage: 'Is it on the way?',
      lastMessageAt: new Date(Date.now() - 2 * 60000).toISOString(),
      unreadCount: 1,
      takeoverMode: 'ai',
      messages: [
        { id: 'v1', sender: 'customer', text: 'Hey, I placed an order earlier. Is it on the way?', timestamp: new Date(Date.now() - 2 * 60000).toISOString() },
      ],
    },
  ];
  mockConversations.forEach((convo) => {
    const ref = doc(db, 'businesses', businessId, 'conversations', convo.id);
    batch.set(ref, convo);
  });

  // 8. Subscription Init
  const subRef = doc(db, 'businesses', businessId, 'settings', 'subscription');
  batch.set(subRef, {
    planId: 'trial',
    status: 'active',
    expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(), // 14-day trial
    payments: [
      {
        id: 'pay_init',
        amount: 0,
        date: new Date().toISOString(),
        status: 'success',
        planId: 'trial',
      },
    ],
  });

  await batch.commit();
}
