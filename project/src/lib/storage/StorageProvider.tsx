import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { Conversation, Project } from './models';
import {
  type IConversationRepository,
  type IProjectRepository,
  LocalStorageConversationRepository,
  LocalStorageProjectRepository,
} from './repositories';

interface StorageContextValue {
  conversations: IConversationRepository;
  projects: IProjectRepository;
}

const StorageContext = createContext<StorageContextValue | null>(null);

// Initialize standard repositories
const defaultConversations = new LocalStorageConversationRepository();
const defaultProjects = new LocalStorageProjectRepository();

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(
    () => ({
      conversations: defaultConversations,
      projects: defaultProjects,
    }),
    []
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}

// React Hooks for reactive data
export function useConversations() {
  const { conversations } = useStorage();
  const [data, setData] = useState<Conversation[]>(() => conversations.list());

  useEffect(() => {
    return conversations.subscribe(() => {
      setData(conversations.list());
    });
  }, [conversations]);

  return data;
}

export function useConversation(id?: string) {
  const { conversations } = useStorage();
  const [data, setData] = useState<Conversation | undefined>(() => (id ? conversations.get(id) : undefined));

  useEffect(() => {
    if (!id) {
      setData(undefined);
      return;
    }
    
    // Initial fetch in case it changed
    setData(conversations.get(id));
    
    return conversations.subscribe(() => {
      setData(conversations.get(id));
    });
  }, [conversations, id]);

  return data;
}

export function useProjects() {
  const { projects } = useStorage();
  const [data, setData] = useState<Project[]>(() => projects.list());

  useEffect(() => {
    return projects.subscribe(() => {
      setData(projects.list());
    });
  }, [projects]);

  return data;
}
