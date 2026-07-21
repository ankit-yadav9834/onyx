import { useState, useEffect } from 'react';
import { useStorage } from './StorageProvider';
import type { Settings } from './models';

export function useConversations() {
  const { conversations } = useStorage();
  const [list, setList] = useState(conversations.list());

  useEffect(() => {
    const unsub = conversations.subscribe(() => setList(conversations.list()));
    return unsub;
  }, [conversations]);

  return list;
}

export function useConversation(id?: string) {
  const { conversations } = useStorage();
  const [data, setData] = useState(() => (id ? conversations.get(id) : undefined));

  useEffect(() => {
    if (!id) {
      setData(undefined);
      return;
    }
    
    setData(conversations.get(id));
    
    return conversations.subscribe(() => {
      setData(conversations.get(id));
    });
  }, [conversations, id]);

  return data;
}

export function useProjects() {
  const { projects } = useStorage();
  const [list, setList] = useState(projects.list());

  useEffect(() => {
    const unsub = projects.subscribe(() => setList(projects.list()));
    return unsub;
  }, [projects]);

  return list;
}

export function useSettings() {
  const { settings } = useStorage();
  const [current, setCurrent] = useState(settings.get());

  useEffect(() => {
    const unsub = settings.subscribe(() => setCurrent(settings.get()));
    return unsub;
  }, [settings]);

  return [current, (s: Partial<Settings>) => settings.save(s)] as const;
}

export function useQuerySessions() {
  const { querySessions } = useStorage();
  const [list, setList] = useState(querySessions.list());

  useEffect(() => {
    const unsub = querySessions.subscribe(() => setList(querySessions.list()));
    return unsub;
  }, [querySessions]);

  return list;
}

export function useAuditLogs() {
  const { auditLogs } = useStorage();
  const [list, setList] = useState(auditLogs.list());

  useEffect(() => {
    const unsub = auditLogs.subscribe(() => setList(auditLogs.list()));
    return unsub;
  }, [auditLogs]);

  return list;
}
