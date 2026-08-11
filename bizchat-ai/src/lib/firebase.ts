import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { UserProfile, BusinessSettings, Product, Order, Customer, Conversation, AppNotification } from '../types';

// Real Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnicveJlt3PD49GAPwFjt4qTl4lfzaUZo",
  authDomain: "gen-lang-client-0324852513.firebaseapp.com",
  projectId: "gen-lang-client-0324852513",
  storageBucket: "gen-lang-client-0324852513.firebasestorage.app",
  messagingSenderId: "318831845654",
  appId: "1:318831845654:web:82e2017bf0f83dbb117037"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Mock DB Initial Data for fallback/offline experience
const mockProducts: Product[] = [
  { id: 'p1', name: 'Premium Coffee Beans (1kg)', price: 24.99, category: 'Beverages', description: 'Organic fair-trade medium roast coffee beans.', available: true, createdAt: Date.now() },
  { id: 'p2', name: 'Ceramic Espresso Cup', price: 12.50, category: 'Accessories', description: 'Handmade modern ceramic cup with matte glaze finish.', available: true, createdAt: Date.now() },
  { id: 'p3', name: 'Cold Brew Concentrate', price: 18.00, category: 'Beverages', description: '12-hour steeped organic concentrate, makes 10 servings.', available: false, createdAt: Date.now() },
  { id: 'p4', name: 'Drip Coffee Maker', price: 89.99, category: 'Appliances', description: 'Programmable 12-cup drip brewer with glass carafe.', available: true, createdAt: Date.now() }
];

const mockCustomers: Customer[] = [
  { id: 'c1', name: 'John Doe', phone: '+1 555-0199', email: 'john@example.com', lastConversation: 'How much are the coffee beans?', notes: 'Prefers light roast, orders monthly.', tags: ['VIP', 'Coffee Lover'] },
  { id: 'c2', name: 'Jane Smith', phone: '+1 555-0122', email: 'jane.s@example.com', lastConversation: 'Is the drip coffee maker in stock?', notes: 'Inquired about warranty, very friendly.', tags: ['New Customer'] },
  { id: 'c3', name: 'Robert Lee', phone: '+1 555-0144', email: 'robert@example.com', lastConversation: 'I received my espresso cups today! Thank you!', notes: 'Local business owner, bulk buyer.', tags: ['Bulk Buyer', 'Cups'] }
];

const mockOrders: Order[] = [
  {
    id: 'ord1',
    customerName: 'John Doe',
    customerPhone: '+1 555-0199',
    items: [{ productId: 'p1', productName: 'Premium Coffee Beans (1kg)', quantity: 2, price: 24.99 }],
    totalAmount: 49.98,
    status: 'Delivered',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000 // 3 days ago
  },
  {
    id: 'ord2',
    customerName: 'Jane Smith',
    customerPhone: '+1 555-0122',
    items: [{ productId: 'p4', productName: 'Drip Coffee Maker', quantity: 1, price: 89.99 }],
    totalAmount: 89.99,
    status: 'Preparing',
    createdAt: Date.now() - 12 * 60 * 60 * 1000 // 12 hours ago
  },
  {
    id: 'ord3',
    customerName: 'Robert Lee',
    customerPhone: '+1 555-0144',
    items: [
      { productId: 'p2', productName: 'Ceramic Espresso Cup', quantity: 4, price: 12.50 },
      { productId: 'p1', productName: 'Premium Coffee Beans (1kg)', quantity: 1, price: 24.99 }
    ],
    totalAmount: 74.99,
    status: 'New',
    createdAt: Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
  }
];

const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    customerId: 'c1',
    customerName: 'John Doe',
    lastMessage: 'How much are the coffee beans?',
    lastMessageTime: Date.now() - 10 * 60 * 1000,
    status: 'active',
    unreadCount: 1,
    messages: [
      { id: 'm1', sender: 'customer', text: 'Hello, what are your shop working hours today?', timestamp: Date.now() - 60 * 60 * 1000 },
      { id: 'm2', sender: 'ai', text: 'Hi! We are open from 8:00 AM to 6:00 PM today. Let me know if you need help finding anything!', timestamp: Date.now() - 58 * 60 * 1000 },
      { id: 'm3', sender: 'customer', text: 'Excellent! How much are the coffee beans?', timestamp: Date.now() - 10 * 60 * 1000 }
    ]
  },
  {
    id: 'conv2',
    customerId: 'c2',
    customerName: 'Jane Smith',
    lastMessage: 'Is the drip coffee maker in stock?',
    lastMessageTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
    status: 'active',
    unreadCount: 0,
    messages: [
      { id: 'm4', sender: 'customer', text: 'Hi, is the drip coffee maker in stock?', timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 },
      { id: 'm5', sender: 'ai', text: 'Yes, the Drip Coffee Maker is currently in stock for $89.99! You can place an order directly with me if you’d like.', timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 + 1000 }
    ]
  },
  {
    id: 'conv3',
    customerId: 'c3',
    customerName: 'Robert Lee',
    lastMessage: 'I received my espresso cups today! Thank you!',
    lastMessageTime: Date.now() - 4 * 24 * 60 * 60 * 1000,
    status: 'archived',
    unreadCount: 0,
    messages: [
      { id: 'm6', sender: 'customer', text: 'Can I order 4 cups and some beans?', timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 },
      { id: 'm7', sender: 'ai', text: 'Of course! I have added 4 Ceramic Espresso Cups ($12.50 each) and 1 bag of Premium Coffee Beans ($24.99) to your cart. Total is $74.99. Would you like me to process this order?', timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 500 },
      { id: 'm8', sender: 'customer', text: 'Yes please!', timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 1000 },
      { id: 'm9', sender: 'ai', text: 'Order processed successfully! Order ID is #ord3.', timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 + 2000 },
      { id: 'm10', sender: 'customer', text: 'I received my espresso cups today! Thank you!', timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000 }
    ]
  }
];

const mockNotifications: AppNotification[] = [
  { id: 'n1', title: 'New Order Received', message: 'Order #ord3 from Robert Lee total $74.99 is waiting for review.', type: 'success', timestamp: Date.now() - 2 * 60 * 1000, read: false },
  { id: 'n2', title: 'New Customer Inquiry', message: 'John Doe is asking about premium coffee beans.', type: 'info', timestamp: Date.now() - 10 * 60 * 1000, read: false },
  { id: 'n3', title: 'System Alert', message: 'Gemini API status is fully operational.', type: 'info', timestamp: Date.now() - 1 * 60 * 60 * 1000, read: true }
];

const defaultSettings: BusinessSettings = {
  shopName: 'BizChat Beans & Brews',
  address: '123 Tech Avenue, Silicon Valley, CA 94025',
  phone: '+1 (555) 123-4567',
  workingHours: 'Mon-Fri: 8:00 AM - 6:00 PM, Sat: 9:00 AM - 4:00 PM, Sun: Closed',
  logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200',
  aiPersonality: 'Professional, Warm, and Helpful',
  language: 'English',
  greetingMessage: 'Hello! Welcome to Beans & Brews. I am your AI Assistant. How can I help you with our premium coffees, cups, or order details today?',
  customInstructions: 'You represent Beans & Brews coffee shop. Be polite and conversational. If users ask about ordering, let them know they can buy beans or espresso cups. Always direct them to place orders when they specify items.'
};

// Initialization helpers for LocalStorage
const getStored = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data);
};

const setStored = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// STORAGE MANAGERS (Firestore with localStorage Fallback)
export const dbService = {
  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const list: Product[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Product);
      });
      if (list.length > 0) {
        setStored('bizchat_products', list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore failed, loading from local:', e);
    }
    return getStored<Product[]>('bizchat_products', mockProducts);
  },

  async saveProduct(product: Product): Promise<void> {
    try {
      await setDoc(doc(db, 'products', product.id), product);
    } catch (e) {
      console.warn('Firestore failed, saving locally:', e);
    }
    const current = getStored<Product[]>('bizchat_products', mockProducts);
    const index = current.findIndex(p => p.id === product.id);
    if (index >= 0) {
      current[index] = product;
    } else {
      current.unshift(product);
    }
    setStored('bizchat_products', current);
  },

  async deleteProduct(productId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (e) {
      console.warn('Firestore failed, deleting locally:', e);
    }
    const current = getStored<Product[]>('bizchat_products', mockProducts);
    const updated = current.filter(p => p.id !== productId);
    setStored('bizchat_products', updated);
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'customers'));
      const list: Customer[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Customer);
      });
      if (list.length > 0) {
        setStored('bizchat_customers', list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore failed, loading customers locally:', e);
    }
    return getStored<Customer[]>('bizchat_customers', mockCustomers);
  },

  async saveCustomer(customer: Customer): Promise<void> {
    try {
      await setDoc(doc(db, 'customers', customer.id), customer);
    } catch (e) {
      console.warn('Firestore failed, saving customer locally:', e);
    }
    const current = getStored<Customer[]>('bizchat_customers', mockCustomers);
    const index = current.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      current[index] = customer;
    } else {
      current.push(customer);
    }
    setStored('bizchat_customers', current);
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const list: Order[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Order);
      });
      if (list.length > 0) {
        setStored('bizchat_orders', list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore failed, loading orders locally:', e);
    }
    return getStored<Order[]>('bizchat_orders', mockOrders);
  },

  async saveOrder(order: Order): Promise<void> {
    try {
      await setDoc(doc(db, 'orders', order.id), order);
    } catch (e) {
      console.warn('Firestore failed, saving order locally:', e);
    }
    const current = getStored<Order[]>('bizchat_orders', mockOrders);
    const index = current.findIndex(o => o.id === order.id);
    if (index >= 0) {
      current[index] = order;
    } else {
      current.unshift(order);
    }
    setStored('bizchat_orders', current);
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'conversations'));
      const list: Conversation[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Conversation);
      });
      if (list.length > 0) {
        setStored('bizchat_conversations', list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore failed, loading conversations locally:', e);
    }
    return getStored<Conversation[]>('bizchat_conversations', mockConversations);
  },

  async saveConversation(conv: Conversation): Promise<void> {
    try {
      await setDoc(doc(db, 'conversations', conv.id), conv);
    } catch (e) {
      console.warn('Firestore failed, saving conversation locally:', e);
    }
    const current = getStored<Conversation[]>('bizchat_conversations', mockConversations);
    const index = current.findIndex(c => c.id === conv.id);
    if (index >= 0) {
      current[index] = conv;
    } else {
      current.unshift(conv);
    }
    setStored('bizchat_conversations', current);
  },

  // Settings
  async getSettings(): Promise<BusinessSettings> {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'business_config'));
      if (docSnap.exists()) {
        const data = docSnap.data() as BusinessSettings;
        setStored('bizchat_settings', data);
        return data;
      }
    } catch (e) {
      console.warn('Firestore failed, loading settings locally:', e);
    }
    return getStored<BusinessSettings>('bizchat_settings', defaultSettings);
  },

  async saveSettings(settings: BusinessSettings): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', 'business_config'), settings);
    } catch (e) {
      console.warn('Firestore failed, saving settings locally:', e);
    }
    setStored('bizchat_settings', settings);
  },

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'notifications'));
      const list: AppNotification[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as AppNotification);
      });
      if (list.length > 0) {
        setStored('bizchat_notifications', list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore failed, loading notifications locally:', e);
    }
    return getStored<AppNotification[]>('bizchat_notifications', mockNotifications);
  },

  async saveNotifications(notifications: AppNotification[]): Promise<void> {
    setStored('bizchat_notifications', notifications);
    try {
      // For each, push to Firestore
      for (const notif of notifications) {
        await setDoc(doc(db, 'notifications', notif.id), notif);
      }
    } catch (e) {
      console.warn('Firestore failed, saving notifications locally:', e);
    }
  },

  // Global Users Analytics (Admin)
  async getAdminUsers(): Promise<UserProfile[]> {
    const mockUsers: UserProfile[] = [
      { uid: 'u1', email: 'neoedits2008@gmail.com', displayName: 'Workspace Owner', role: 'admin', plan: 'business', shopName: 'Brews & Beans HQ' },
      { uid: 'u2', email: 'baker@example.com', displayName: 'Artisan Bakery', role: 'business', plan: 'pro', shopName: 'The Golden Crust' },
      { uid: 'u3', email: 'boutique@example.com', displayName: 'Flora & Co', role: 'business', plan: 'free', shopName: 'Flora Boutique' }
    ];
    return mockUsers;
  }
};
