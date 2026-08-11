/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  role: 'student' | 'admin';
  studyStreak: number;
  lastStudyDate: string | null;
  dailyStudyGoal: number; // in minutes
  currentPlan: 'free' | 'pro' | 'premium';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled';
  subscriptionExpiresAt: string | null;
  subscriptionPlan?: 'free' | 'pro' | 'premium';
  subscriptionStart?: string | null;
  subscriptionEnd?: string | null;
  aiChatsToday?: number;
  aiStudyPlansThisMonth?: number;
  notesGeneratedThisMonth?: number;
  flashcardsGeneratedThisMonth?: number;
  quizGeneratedThisMonth?: number;
  uploadedFiles?: number;
  pdfSummariesGeneratedThisMonth?: number;
  customPomodoroDuration?: number;
  customBreakDuration?: number;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string; // The user's input text or raw notes
  summary: string;
  detailedNotes?: string;
  keyPoints: string[];
  formulas: string[];
  definitions: string[];
  mindMapOutline: string; // Textual representation or markdown of a mind map
  language: 'en' | 'hi' | 'both';
  createdAt: string;
}

export interface PDFSummary {
  id: string;
  userId: string;
  fileName: string;
  fileSize: string;
  summary: string;
  keyPoints: string[];
  formulas: string[];
  definitions: string[];
  revisionNotes: string;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
  lastReviewedAt?: string | null;
}

export interface FlashcardSet {
  id: string;
  userId: string;
  title: string;
  cards: Flashcard[];
  createdAt: string;
}

export interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[]; // for multiple_choice
  correctAnswer: string;
  explanation: string;
  userAnswer?: string;
}

export interface Quiz {
  id: string;
  userId: string;
  title: string;
  sourceType: 'note' | 'pdf' | 'manual';
  sourceId?: string;
  questions: Question[];
  score?: number | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface StudyTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Exam {
  id: string;
  userId: string;
  name: string;
  date: string; // ISO Date
  timetable: {
    day: string; // e.g. "Monday"
    topics: string[];
  }[];
  tasks: StudyTask[];
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  durationMinutes: number;
  type: 'pomodoro' | 'short_break' | 'long_break';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: string;
}

export interface AIChat {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface GroupSessionRoom {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  subject: string;
  activeTimerType: 'pomodoro' | 'short_break' | 'long_break';
  timerMinutesRemaining: number;
  timerSecondsRemaining: number;
  timerIsActive: boolean;
  memberCount: number;
  createdAt: string;
}

export interface GroupChatMessage {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: string;
}

