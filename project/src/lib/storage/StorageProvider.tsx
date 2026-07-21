import React, { createContext, useContext, useMemo } from 'react';
import {
  type IConversationRepository,
  type IProjectRepository,
  type ISettingsRepository,
  type IQuerySessionRepository,
  type IAuditLogRepository,
  LocalStorageConversationRepository,
  LocalStorageProjectRepository,
  LocalStorageSettingsRepository,
  LocalStorageQuerySessionRepository,
  LocalStorageAuditLogRepository
} from './repositories';

interface StorageContextValue {
  conversations: IConversationRepository;
  projects: IProjectRepository;
  settings: ISettingsRepository;
  querySessions: IQuerySessionRepository;
  auditLogs: IAuditLogRepository;
}

const StorageContext = createContext<StorageContextValue | null>(null);

const defaultConversations = new LocalStorageConversationRepository();
const defaultProjects = new LocalStorageProjectRepository();
const defaultSettings = new LocalStorageSettingsRepository();
const defaultQuerySessions = new LocalStorageQuerySessionRepository();
const defaultAuditLogs = new LocalStorageAuditLogRepository();

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(
    () => ({
      conversations: defaultConversations,
      projects: defaultProjects,
      settings: defaultSettings,
      querySessions: defaultQuerySessions,
      auditLogs: defaultAuditLogs,
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
