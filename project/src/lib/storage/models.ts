// OrchestrAI — Storage domain models

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  status?: string;
  isGenerating?: boolean;
  querySessionId?: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title: string;
  projectId?: string;
  createdAt: number;
  updatedAt: number;
  lastMessage?: string;
  pinned: boolean;
  archived: boolean;
  tags: string[];
  messages: Message[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  favorite: boolean;
  conversationIds: string[];
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  model: string;
  notifications: boolean;
}
