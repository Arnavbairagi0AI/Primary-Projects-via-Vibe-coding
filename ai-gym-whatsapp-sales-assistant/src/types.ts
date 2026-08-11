export interface Lead {
  id: string;
  name: string;
  phone: string;
  age: string;
  gender: string;
  city: string;
  occupation: string;
  goal: string;
  experienceLevel: "Beginner" | "Intermediate" | "Advanced" | "";
  preferredTime: "Morning" | "Afternoon" | "Evening" | "Night" | "";
  medicalConditions: string;
  membershipInterest: "Monthly" | "Quarterly" | "Half-Yearly" | "Annual" | "Personal Training" | "Group Classes" | "";
  trialStatus: "none" | "offered" | "accepted" | "booked" | "visited" | "no-show";
  leadScore: number;
  notes: string;
  status: "active" | "inactive" | "human_takeover" | "converted";
  lastInteractionAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  sender: "customer" | "bot" | "agent";
  text: string;
  timestamp: string;
}

export interface Booking {
  id: string;
  leadId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  timeSlot: string;
  status: "scheduled" | "completed" | "no-show";
  createdAt: string;
}

export interface IntegrationConfig {
  whatsappToken: string;
  whatsappPhoneId: string;
  openaiApiKey: string;
  googleSheetsId: string;
  googleCalendarId: string;
  ownerEmail: string;
  systemPrompt: string;
}

export interface IntegrationLog {
  id: string;
  type: "whatsapp" | "sheets" | "calendar" | "email" | "system";
  status: "success" | "error" | "info";
  title: string;
  details: string;
  timestamp: string;
}
