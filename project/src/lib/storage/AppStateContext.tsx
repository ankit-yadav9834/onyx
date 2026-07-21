import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import type { Conversation, Project, Settings, Message } from './models';
import type { QuerySession, AuditLog } from '@/lib/types';
import {
  LocalStorageConversationRepository,
  LocalStorageProjectRepository,
  LocalStorageSettingsRepository,
  LocalStorageQuerySessionRepository,
  LocalStorageAuditLogRepository,
} from './repositories';

// ─── Singleton repository instances ───
const convRepo = new LocalStorageConversationRepository();
const projRepo = new LocalStorageProjectRepository();
const settingsRepo = new LocalStorageSettingsRepository();
const qsRepo = new LocalStorageQuerySessionRepository();
const auditRepo = new LocalStorageAuditLogRepository();

// ─── AppState interface: single source of truth ───
export interface AppState {
  // Active navigation pointers
  activeConversationId: string | null;
  activeQuerySessionId: string | null;
  setActiveConversationId: (id: string | null) => void;
  setActiveQuerySessionId: (id: string | null) => void;
  startNewChat: () => void;

  // Repository accessors (direct, for mutations)
  conversations: typeof convRepo;
  projects: typeof projRepo;
  settings: typeof settingsRepo;
  querySessions: typeof qsRepo;
  auditLogs: typeof auditRepo;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeQuerySessionId, setActiveQuerySessionId] = useState<string | null>(null);

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setActiveQuerySessionId(null);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      activeConversationId,
      activeQuerySessionId,
      setActiveConversationId,
      setActiveQuerySessionId,
      startNewChat,
      conversations: convRepo,
      projects: projRepo,
      settings: settingsRepo,
      querySessions: qsRepo,
      auditLogs: auditRepo,
    }),
    [activeConversationId, activeQuerySessionId, startNewChat],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

/** Single hook — replaces both useStorage() and useActiveState(). */
export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

// ─── Convenience reactive hooks (subscribe to repo changes) ───

export function useConversations(): Conversation[] {
  const { conversations } = useAppState();
  const [list, setList] = useState(conversations.list());
  useEffect(() => conversations.subscribe(() => setList(conversations.list())), [conversations]);
  return list;
}

export function useConversation(id?: string) {
  const { conversations } = useAppState();
  const [data, setData] = useState(() => (id ? conversations.get(id) : undefined));
  useEffect(() => {
    if (!id) { setData(undefined); return; }
    setData(conversations.get(id));
    return conversations.subscribe(() => setData(conversations.get(id)));
  }, [conversations, id]);
  return data;
}

export function useProjects(): Project[] {
  const { projects } = useAppState();
  const [list, setList] = useState(projects.list());
  useEffect(() => projects.subscribe(() => setList(projects.list())), [projects]);
  return list;
}

export function useSettings() {
  const { settings } = useAppState();
  const [current, setCurrent] = useState(settings.get());
  useEffect(() => settings.subscribe(() => setCurrent(settings.get())), [settings]);
  return [current, (s: Partial<Settings>) => settings.save(s)] as const;
}

export function useQuerySessions(): QuerySession[] {
  const { querySessions } = useAppState();
  const [list, setList] = useState(querySessions.list());
  useEffect(() => querySessions.subscribe(() => setList(querySessions.list())), [querySessions]);
  return list;
}

export function useAuditLogs(): AuditLog[] {
  const { auditLogs } = useAppState();
  const [list, setList] = useState(auditLogs.list());
  useEffect(() => auditLogs.subscribe(() => setList(auditLogs.list())), [auditLogs]);
  return list;
}
