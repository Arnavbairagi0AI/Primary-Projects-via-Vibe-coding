export type TabType = 'home' | 'ai-tutor' | 'notes' | 'planner' | 'profile';

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  imageUrl?: string;
  diagramUrl?: string;
  isStreaming?: boolean;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  subject: string;
  mastered: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  subject: string;
  date: string;
  summary: string;
  flashcardCount: number;
  pdfUrl?: string;
  tags: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ExamMilestone {
  id: string;
  subject: string;
  title: string;
  date: string;
  timeRemaining: string;
  progress: number;
  color: string;
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedDate?: string;
}

export interface UserStats {
  name: string;
  title: string;
  level: number;
  xpCurrent: number;
  xpMax: number;
  streakDays: number;
  todayGoalPercent: number;
  todayStudyHours: number;
  targetStudyHours: number;
  focusScore: number;
  focusChangePercent: number;
  peakFocusTime: string;
  recommendedAction: string;
  subjectHours: {
    math: number;
    physics: number;
    chemistry: number;
  };
  cognitiveHeatmap: {
    strong: string[];
    weak: string[];
  };
}
