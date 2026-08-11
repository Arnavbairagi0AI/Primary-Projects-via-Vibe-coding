export type UserRole =
  | 'Super Admin'
  | 'Company Admin'
  | 'Tender Manager'
  | 'Project Manager'
  | 'Finance Manager'
  | 'Employee';

export interface BaseDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: string;
}

export interface UserProfile extends BaseDocument {
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  companyId: string | null;
  onboarded: boolean;
  phoneNumber?: string;
}

export interface CompanyDetails extends BaseDocument {
  companyName: string;
  gstNumber: string;
  pan: string;
  registrationNumber: string;
  ownerName: string;
  businessEmail: string;
  phoneNumber: string;
  address: string;
  state: string;
  city: string;
  pincode: string;
  website?: string;
  yearsInBusiness: number;
  annualTurnover: string; // e.g., "5-10 Cr"
  employeeCount: number;
  constructionCategories: string[]; // e.g., "Roads", "Bridges", "Buildings", "Water Supply"
  preferredTenderCategories: string[];
  preferredStates: string[];
  preferredBudgetRange: {
    min: number; // in lakhs/crores
    max: number;
  };
}

export interface EmployeeProfile extends BaseDocument {
  companyId: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: string;
}

export interface TenderNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface TenderDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface Tender extends BaseDocument {
  companyId: string;
  title: string;
  referenceNumber: string;
  department: string;
  authority: string;
  category: string;
  state: string;
  city: string;
  estimatedValue: number;
  emdAmount: number;
  documentFee: number;
  publishedDate: string;
  closingDate: string;
  openingDate: string;
  location: string;
  description: string;
  status: 'Draft' | 'Open' | 'Preparing' | 'Submitted' | 'Evaluation' | 'Won' | 'Lost' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: string; // UserId or EmployeeId or Name
  createdBy: string;
  notes: TenderNote[];
  tags: string[];
  documents: TenderDocument[];
  createdAt: string;
  updatedAt: string;

  // Legacy field support for complete compatibility
  deleted?: boolean;
  archived?: boolean;
  tenderNumber?: string;
  value?: number;
  valueUnit?: 'Lakhs' | 'Crores';
  publishDate?: string;
  deadlineDate?: string;
  aiMatchScore?: number;
  aiMatchReasoning?: string;
  aiKeyRequirements?: string[];
  aiEligibilityCheck?: boolean;
}

export interface Project extends BaseDocument {
  companyId: string;
  tenderId?: string;
  title: string;
  client: string;
  value: number;
  valueUnit: 'Lakhs' | 'Crores';
  startDate: string;
  endDate: string;
  managerId: string;
  progress: number; // 0 to 100
  budgetSpent: number;
  tasksCount: {
    total: number;
    completed: number;
  };
}

export interface SystemNotification extends BaseDocument {
  userId: string;
  companyId: string | null;
  title: string;
  message: string;
  read: boolean;
  type: 'tender_match' | 'project_update' | 'system' | 'team';
}

export interface ActivityLog extends BaseDocument {
  companyId: string | null;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  notifications: {
    emailAlerts: boolean;
    tenderMatches: boolean;
    projectUpdates: boolean;
    marketing: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number; // in minutes
  };
}
