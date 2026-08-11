/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EngineType = 'chatgpt' | 'claude' | 'gemini' | 'openclaw' | 'blackbox' | 'unified' | 'auto';

export interface Message {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  engine?: Exclude<EngineType, 'unified'>; // For unified view
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  engine: EngineType;
  title: string;
  messages: Message[];
  createdAt: string;
}

export interface ProxyRoute {
  id: string;
  name: string;
  type: 'scraping' | 'mirror' | 'local_claw' | 'free_api';
  status: 'active' | 'degraded' | 'blocked';
  latency: number; // in ms
  uptime: number; // percentage
  requestsRotated: number;
  description: string;
}

export interface MonorepoFile {
  name: string;
  path: string;
  content: string;
  language: 'typescript' | 'rust' | 'json' | 'markdown' | 'bash';
}

export interface MonorepoFolder {
  name: string;
  path: string;
  files: MonorepoFile[];
  subfolders?: MonorepoFolder[];
}

export interface DatabaseRow {
  id: string;
  table: 'conversations' | 'transcripts' | 'credentials_cache' | 'routing_logs';
  data: Record<string, any>;
  timestamp: string;
}

export interface TokenUsage {
  chatgpt: { input: number; output: number; sessionsCount: number };
  claude: { input: number; output: number; sessionsCount: number };
  gemini: { input: number; output: number; sessionsCount: number };
  openclaw: { input: number; output: number; sessionsCount: number };
  blackbox: { input: number; output: number; sessionsCount: number };
}

