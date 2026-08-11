import { Tender, SubscriptionPlan } from './types';

export const SUBSCRIPTION_PLANS = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    price: 0,
    features: [
      'Access to 5 active tenders',
      'Basic search & filters',
      'AI summaries (2 per month)',
      '1 employee seat',
      'In-app notifications'
    ],
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200'
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 4999, // INR per month
    features: [
      'Unlimited tender search & filters',
      'Save & track up to 30 tenders',
      'AI Summaries & Document check (15 per month)',
      'Up to 3 employee seats',
      'Email & in-app alerts'
    ],
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  {
    id: 'business',
    name: 'Business Pro',
    price: 14999, // INR per month
    features: [
      'Everything in Starter',
      'Save & organize unlimited tenders',
      'Full AI Analytics & Eligibility evaluations (Unlimited)',
      'Up to 15 employee seats with sub-teams',
      'Team assignment & task checklists',
      'Daily email digest & custom instant alerts'
    ],
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 39999, // INR per month
    features: [
      'Everything in Business Pro',
      'Unlimited employee seats & divisions',
      'Custom API access & tender ingest streams',
      'Dedicated relationship account manager',
      'Custom pre-qualification assessment reports',
      'Priority 24/7 technical phone support'
    ],
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200'
  }
];

export const INITIAL_TENDERS: Tender[] = [
  {
    id: 'tender-001',
    title: 'Installation of Grid-Connected Rooftop Solar Power Plants',
    refNo: 'NREDCAP/RE/SPV/456-2026',
    authority: 'NREDCAP',
    department: 'Renewable Energy Department',
    state: 'Andhra Pradesh',
    city: 'Vijayawada',
    category: 'Energy & Power',
    value: 7500000, // 75 Lakhs
    deadline: '2026-07-25T17:00:00Z',
    status: 'active',
    createdAt: '2026-07-01'
  },
  {
    id: 'tender-002',
    title: 'Development of Smart Water Management System with IoT Sensors',
    refNo: 'KSC/IT/WMS-890/2026',
    authority: 'Kochi Smart City Limited',
    department: 'Urban Development & IT',
    state: 'Kerala',
    city: 'Kochi',
    category: 'Information Technology',
    value: 12000000, // 1.2 Crores
    deadline: '2026-07-15T15:00:00Z',
    status: 'active',
    createdAt: '2026-06-28'
  },
  {
    id: 'tender-003',
    title: 'Supply and Commissioning of Advanced Medical Imaging Equipment',
    refNo: 'AIIMS/DEL/MED-IMG/01-2026',
    authority: 'AIIMS Delhi',
    department: 'Procurement Cell',
    state: 'Delhi',
    city: 'New Delhi',
    category: 'Medical & Healthcare',
    value: 45000000, // 4.5 Crores
    deadline: '2026-08-10T14:00:00Z',
    status: 'active',
    createdAt: '2026-06-30'
  },
  {
    id: 'tender-004',
    title: 'Four-Laning & Construction of flyovers on NH-44',
    refNo: 'NHAI/AP-TN/HIGHWAY-234-A',
    authority: 'NHAI',
    department: 'National Highways Authority of India',
    state: 'Tamil Nadu',
    city: 'Madurai',
    category: 'Civil Works & Construction',
    value: 145000000, // 14.5 Crores
    deadline: '2026-09-01T17:30:00Z',
    status: 'active',
    createdAt: '2026-07-02'
  },
  {
    id: 'tender-005',
    title: 'Design and Supply of Cast Component Sets for Rail Engines',
    refNo: 'DLW/VNS/MECH/2026/78',
    authority: 'Diesel Locomotive Works',
    department: 'Mechanical Engineering',
    state: 'Uttar Pradesh',
    city: 'Varanasi',
    category: 'Manufacturing & Heavy Industry',
    value: 3800000, // 38 Lakhs
    deadline: '2026-07-20T12:00:00Z',
    status: 'active',
    createdAt: '2026-06-25'
  },
  {
    id: 'tender-006',
    title: 'Annual Maintenance Contract for Enterprise Data Center Servers',
    refNo: 'BHEL/DC/AMC-45/IT-2026',
    authority: 'Bharat Heavy Electricals Limited',
    department: 'Information Technology Division',
    state: 'Karnataka',
    city: 'Bengaluru',
    category: 'Information Technology',
    value: 2800000, // 28 Lakhs
    deadline: '2026-07-18T16:00:00Z',
    status: 'active',
    createdAt: '2026-06-29'
  },
  {
    id: 'tender-007',
    title: 'Renovation and Construction of Government Model School Buildings',
    refNo: 'PWD/PUN/EDU-REF/2026/09',
    authority: 'PWD Punjab',
    department: 'Education Infrastructure',
    state: 'Punjab',
    city: 'Amritsar',
    category: 'Civil Works & Construction',
    value: 18000000, // 1.8 Crores
    deadline: '2026-07-29T17:00:00Z',
    status: 'active',
    createdAt: '2026-07-01'
  },
  {
    id: 'tender-008',
    title: 'Procurement of High-Capacity Water Treatment & Filtering Chemicals',
    refNo: 'DJB/CHEM-PROC/2026/512',
    authority: 'Delhi Jal Board',
    department: 'Water Supply & Treatment',
    state: 'Delhi',
    city: 'New Delhi',
    category: 'Chemicals & Materials',
    value: 5200000, // 52 Lakhs
    deadline: '2026-07-12T13:00:00Z',
    status: 'active',
    createdAt: '2026-06-26'
  }
];

export const MOCK_ANALYTICS_DATA = {
  mrr: 1425000, // 14.25 Lakhs
  arr: 17100000, // 1.71 Crores
  churnRate: 2.4, // percent
  activeUsersCount: 452,
  tenderViewsCount: 18240,
  savedTendersCount: 3120,
  monthlyPerformance: [
    { month: 'Jan', mrr: 1100000, arr: 13200000, users: 320, signups: 45 },
    { month: 'Feb', mrr: 1180000, arr: 14160000, users: 350, signups: 50 },
    { month: 'Mar', mrr: 1240000, arr: 14880000, users: 380, signups: 55 },
    { month: 'Apr', mrr: 1310000, arr: 15720000, users: 410, signups: 60 },
    { month: 'May', mrr: 1380000, arr: 16560000, users: 435, signups: 40 },
    { month: 'Jun', mrr: 1425000, arr: 17100000, users: 452, signups: 48 }
  ],
  popularCategories: [
    { category: 'Civil Works & Construction', count: 1240, value: 450000000 },
    { category: 'Information Technology', count: 850, value: 240000000 },
    { category: 'Energy & Power', count: 620, value: 180000000 },
    { category: 'Medical & Healthcare', count: 310, value: 320000000 },
    { category: 'Manufacturing & Heavy Industry', count: 280, value: 85000000 },
    { category: 'Chemicals & Materials', count: 180, value: 35000000 }
  ],
  popularStates: [
    { state: 'Delhi', count: 520 },
    { state: 'Karnataka', count: 480 },
    { state: 'Andhra Pradesh', count: 410 },
    { state: 'Maharashtra', count: 390 },
    { state: 'Tamil Nadu', count: 350 },
    { state: 'Kerala', count: 210 }
  ]
};

export const MOCK_ACTIVITY_LOGS = [
  { id: 'log-1', userId: 'user-0', userEmail: 'neoedits2008@gmail.com', userName: 'Neo Edits', action: 'User Login', detail: 'Logged in successfully from IP 192.168.1.4', category: 'auth', timestamp: '2026-07-03T08:45:00Z' },
  { id: 'log-2', userId: 'user-0', userEmail: 'neoedits2008@gmail.com', userName: 'Neo Edits', action: 'Save Tender', detail: 'Saved NHAI Road Construction Tender to active dashboard', category: 'tender', timestamp: '2026-07-03T08:50:00Z' },
  { id: 'log-3', userId: 'user-0', userEmail: 'neoedits2008@gmail.com', userName: 'Neo Edits', action: 'AI Assessment', detail: 'Executed Gemini AI eligibility & compliance check on rooftop solar plants tender', category: 'tender', timestamp: '2026-07-03T08:52:10Z' },
  { id: 'log-4', userId: 'admin-1', userEmail: 'admin@tenderflow.ai', userName: 'Super Admin', action: 'Update Settings', detail: 'Modified AI model parameters and updated Daily Digest triggers', category: 'admin', timestamp: '2026-07-03T06:12:00Z' },
  { id: 'log-5', userId: 'user-2', userEmail: 'tarun@it-solutions.in', userName: 'Tarun Sharma', action: 'Subscription Upgrade', detail: 'Upgraded company plan from Starter to Business Pro', category: 'billing', timestamp: '2026-07-02T14:30:00Z' }
];

export const MOCK_FEEDBACK = [
  { id: 'feed-1', userId: 'user-2', companyId: 'comp-2', email: 'tarun@it-solutions.in', subject: 'Incredible AI Accuracy', message: 'The AI checklist and technical terms explainer is saving our bidding team days of manual research. Great work on tender summaries!', rating: 5, status: 'pending', createdAt: '2026-07-02T15:20:00Z' },
  { id: 'feed-2', userId: 'user-3', companyId: 'comp-3', email: 'aravind@solartech.co.in', subject: 'State filters addition', message: 'Would love to see filters for central ministries alongside standard state-wide filters.', rating: 4, status: 'resolved', createdAt: '2026-06-30T10:00:00Z', adminNotes: 'Added central department classifications under state drop-down (as Central/Delhi).' }
];
