/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  bio: string;
  isAnonymous: boolean;
  isCreator?: boolean;
  isAdmin?: boolean;
  followersCount: number;
  followingCount: number;
  favorites: string[]; // character IDs
  likes: string[]; // character IDs
  badges: string[];
  achievements: { id: string; name: string; unlockedAt: string; icon: string }[];
  stats: {
    totalChats: number;
    totalMessages: number;
    creationsCount: number;
    streakDays: number;
  };
  createdAt: string;
}

export interface Character {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  greeting: string;
  greetingVariations?: string[];
  avatar: string;
  banner?: string;
  category: string;
  tags: string[];
  visibility: 'public' | 'private' | 'unlisted';
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  
  // Personality details
  personality: string;
  longDescription: string;
  systemPrompt: string;
  scenario?: string;
  speakingStyle?: string;
  writingStyle?: string;
  age?: string;
  occupation?: string;
  backstory?: string;
  memoryInstructions?: string;
  
  // Advanced Settings
  temperature: number;
  topP: number;
  topK: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxTokens: number;
  contextWindow: number;
  reasoningMode: boolean;
  streaming: boolean;
  safetyLevel: 'low' | 'medium' | 'high';
  memoryLength: number; // context messages to remember
  mode: 'Normal' | 'Roleplay' | 'Story' | 'Companion' | 'Tutor' | 'Debate' | 'Game Master' | 'Therapist' | 'Friend' | 'Language Learning' | 'Interview' | 'Coding Assistant';
  
  // Image Generation settings
  avatarStyle?: string;
  expressions?: { [key: string]: string }; // e.g., 'happy': 'url_to_happy_avatar'
  
  // Voice Settings
  voiceId?: string;
  voiceSpeed?: number;
  voicePitch?: number;
  voiceEmotion?: string;

  // Social & Stats
  likesCount: number;
  chatsCount: number;
  rating?: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string; // 'user' or characterId
  senderName: string;
  text: string;
  createdAt: string;
  isPinned?: boolean;
  type?: 'text' | 'image' | 'voice' | 'file';
  attachmentUrl?: string;
  audioUrl?: string;
  isStreaming?: boolean;
  mood?: string; // e.g. happy, sad, angry, dramatic
  expressionUrl?: string; // character active expression image
}

export interface Conversation {
  id: string;
  title: string;
  characterId: string; // Single character ID, or 'group'
  characterIds?: string[]; // For group chats
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;
  isPinned?: boolean;
  folderId?: string;
}

export interface MemoryItem {
  id: string;
  characterId: string;
  userId: string;
  fact: string;
  relationshipScore: number; // 0-100 relationship meter
  lastUpdated: string;
  category: 'preference' | 'fact' | 'milestone' | 'nickname' | 'other';
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface ApiProviderConfig {
  provider: 'gemini' | 'openai' | 'claude' | 'openrouter' | 'groq' | 'deepseek' | 'ollama' | 'lmstudio' | 'koboldcpp';
  apiKey: string;
  baseUrl?: string;
  model: string;
}

export interface VoiceConfig {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  provider: 'browser' | 'elevenlabs' | 'google-tts';
  speed: number;
  pitch: number;
  emotion: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

export interface CreatorProfile {
  uid: string;
  displayName: string;
  bio: string;
  avatar: string;
  followersCount: number;
  followingCount: number;
  isVerified: boolean;
  badge?: string; // Verified, Elite Creator, etc.
}
