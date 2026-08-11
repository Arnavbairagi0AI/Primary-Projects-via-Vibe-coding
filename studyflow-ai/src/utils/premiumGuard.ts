/**
 * Centralized subscription and feature permission manager for StudyFlow AI.
 */
import { UserProfile } from '../types';

export type PlanType = 'free' | 'pro' | 'premium';

export interface FeatureDefinition {
  key: string;
  name: string;
  requiredPlan: 'free' | 'pro' | 'premium';
  description: string;
}

export const FEATURES: Record<string, FeatureDefinition> = {
  // Pro (₹199/month) or above features
  aiStudyPlans: {
    key: 'aiStudyPlans',
    name: 'Unlimited AI Study Plans',
    requiredPlan: 'pro',
    description: 'Create customized structured learning roadmaps for any exam.'
  },
  aiChat: {
    key: 'aiChat',
    name: 'Unlimited AI Chat Tutor',
    requiredPlan: 'pro',
    description: 'Ask doubts, solve hard questions, and interact with an intelligent tutor with no daily limit.'
  },
  aiHomeworkHelper: {
    key: 'aiHomeworkHelper',
    name: 'AI Homework Helper & Doubt Solver',
    requiredPlan: 'pro',
    description: 'Get step-by-step explanations for textbook problems.'
  },
  aiNotes: {
    key: 'aiNotes',
    name: 'AI Notes & Summaries (30/month)',
    requiredPlan: 'pro',
    description: 'Generate study notes, bullet insights, and definitions from text.'
  },
  pdfSummarizer: {
    key: 'pdfSummarizer',
    name: 'PDF Summarizer (30/month)',
    requiredPlan: 'pro',
    description: 'Upload complex textbooks or PDFs and get instant revision notes.'
  },
  flashcardGen: {
    key: 'flashcardGen',
    name: 'Flashcard Generator (30/month)',
    requiredPlan: 'pro',
    description: 'Auto-extract mock definitions into active recall cards.'
  },
  quizGen: {
    key: 'quizGen',
    name: 'Quiz Generator (20/month)',
    requiredPlan: 'pro',
    description: 'Instantly build multi-format quizzes with detailed solution guides.'
  },
  mockTests: {
    key: 'mockTests',
    name: 'Mock Exam Series (10/month)',
    requiredPlan: 'pro',
    description: 'Prepare with exam-style questions.'
  },
  mindMaps: {
    key: 'mindMaps',
    name: 'Mind Maps (15/month)',
    requiredPlan: 'pro',
    description: 'Generate visual outlines of key concepts to build memory maps.'
  },
  smartRevision: {
    key: 'smartRevision',
    name: 'Smart Revision Planner & Spaced Repetition',
    requiredPlan: 'pro',
    description: 'Intelligent revision scheduler that reminds you when topics are slipping.'
  },
  fileUploadLimit: {
    key: 'fileUploadLimit',
    name: 'Upload up to 50 Files',
    requiredPlan: 'pro',
    description: 'Keep your textbook library organized in the cloud.'
  },
  groupStudy: {
    key: 'groupStudy',
    name: 'Group Study Rooms (5 Members)',
    requiredPlan: 'pro',
    description: 'Join virtual rooms, run mutual timers, and share notes with peers.'
  },
  basicCareerGuidance: {
    key: 'basicCareerGuidance',
    name: 'Basic AI Career Guidance',
    requiredPlan: 'pro',
    description: 'Get introductory career paths based on your academic profile.'
  },
  fifteenThemes: {
    key: 'fifteenThemes',
    name: '15 Creative Themes',
    requiredPlan: 'pro',
    description: 'Customize StudyFlow dashboard with responsive pastel skins.'
  },

  // Premium (₹499/month) features
  smartAiCalendar: {
    key: 'smartAiCalendar',
    name: 'Smart AI Calendar & Auto Scheduling',
    requiredPlan: 'premium',
    description: 'An AI engine that dynamically shifts calendar tasks when you miss study days.'
  },
  unlimitedAiNotes: {
    key: 'unlimitedAiNotes',
    name: 'Unlimited AI Notes & PDFs',
    requiredPlan: 'premium',
    description: 'Uncapped summaries, note sets, flashcards, and interactive tests.'
  },
  personalizedTutor: {
    key: 'personalizedTutor',
    name: 'Personalized AI Learning Tutor',
    requiredPlan: 'premium',
    description: 'An adaptive tutor that remembers your weak chapters and quizzes you personalizedly.'
  },
  premiumAnalytics: {
    key: 'premiumAnalytics',
    name: 'Premium Analytics & Burnout Detection',
    requiredPlan: 'premium',
    description: 'Get predictions of your exam scores, focus metrics, and stress coaching.'
  },
  adaptivePomodoro: {
    key: 'adaptivePomodoro',
    name: 'AI Adaptive Pomodoro',
    requiredPlan: 'premium',
    description: 'Schedules breaks based on live camera eye-strain and facial feedback.'
  },
  websiteBlocker: {
    key: 'websiteBlocker',
    name: 'Distraction Website Blocker',
    requiredPlan: 'premium',
    description: 'Lock out social media pages while Study Timer is active.'
  },
  unlimitedFiles: {
    key: 'unlimitedFiles',
    name: 'Unlimited File Uploads',
    requiredPlan: 'premium',
    description: 'Upload unlimited files for reference and OCR.'
  },
  ocrNotes: {
    key: 'ocrNotes',
    name: 'OCR Handwritten Notes',
    requiredPlan: 'premium',
    description: 'Scan handwritten notebook snaps and turn them into digitized notes.'
  },
  voiceChat: {
    key: 'voiceChat',
    name: 'Interactive Voice Chat',
    requiredPlan: 'premium',
    description: 'Talk to your learning coach out loud in native speech and receive instant responses.'
  },
  speechToNotes: {
    key: 'speechToNotes',
    name: 'Speech-to-Notes Dictation',
    requiredPlan: 'premium',
    description: 'Dictate live classroom lectures and get organized summary sheets.'
  },
  aiHabitCoach: {
    key: 'aiHabitCoach',
    name: 'AI Habit & Sleep Advisor',
    requiredPlan: 'premium',
    description: 'Personalized advice to keep physical health matched to high study loads.'
  },
  unlimitedGroups: {
    key: 'unlimitedGroups',
    name: 'Unlimited Group Study Rooms',
    requiredPlan: 'premium',
    description: 'Host global public and private peer study sessions.'
  },
  unlimitedThemes: {
    key: 'unlimitedThemes',
    name: 'Unlimited Aesthetic Themes',
    requiredPlan: 'premium',
    description: 'Unlock ultra-premium minimalist and futuristic ambient designs.'
  },
  excelExport: {
    key: 'excelExport',
    name: 'PDF + Excel Export',
    requiredPlan: 'premium',
    description: 'Export raw analytical tables, quiz marks, and timetable grids directly.'
  },
  fastestQueue: {
    key: 'fastestQueue',
    name: 'Fastest AI Dedicated Queue',
    requiredPlan: 'premium',
    description: 'Skip peak-hour queue delays for immediate AI generation.'
  }
};

/**
 * Checks if the user's plan is sufficient for a specific feature key.
 * Now ALWAYS returns true so everyone gets 100% full access to all features.
 */
export function hasFeatureAccess(userProfile: UserProfile | null | undefined, featureKey: string): {
  hasAccess: boolean;
  requiredPlan: 'free' | 'pro' | 'premium';
  featureName: string;
} {
  const feature = FEATURES[featureKey];
  return {
    hasAccess: true,
    requiredPlan: feature?.requiredPlan || 'free',
    featureName: feature?.name || ''
  };
}

/**
 * Returns helper metrics for usage limit tracking.
 * All limits are set to Unlimited for full free access.
 */
export interface UsageMetric {
  name: string;
  used: number;
  limit: number | 'Unlimited';
  unit: string;
  percentage: number;
}

export function getUsageMetrics(userProfile: UserProfile | null | undefined): UsageMetric[] {
  if (!userProfile) return [];

  return [
    {
      name: 'AI Chats Today',
      used: userProfile.aiChatsToday || 0,
      limit: 'Unlimited',
      unit: 'chats/day',
      percentage: 0
    },
    {
      name: 'AI Study Plans',
      used: userProfile.aiStudyPlansThisMonth || 0,
      limit: 'Unlimited',
      unit: 'plans/month',
      percentage: 0
    },
    {
      name: 'AI Revision Notes',
      used: userProfile.notesGeneratedThisMonth || 0,
      limit: 'Unlimited',
      unit: 'notes/month',
      percentage: 0
    },
    {
      name: 'PDF Summaries',
      used: userProfile.pdfSummariesGeneratedThisMonth || 0,
      limit: 'Unlimited',
      unit: 'PDFs/month',
      percentage: 0
    },
    {
      name: 'AI Quiz Arena',
      used: userProfile.quizGeneratedThisMonth || 0,
      limit: 'Unlimited',
      unit: 'quizzes/month',
      percentage: 0
    }
  ];
}
