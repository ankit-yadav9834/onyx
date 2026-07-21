import type { Conversation, Project, Settings } from './models';
import type { QuerySession, AuditLog } from '../types';

export interface ISettingsRepository {
  get(): Settings;
  save(settings: Partial<Settings>): void;
  subscribe(callback: () => void): () => void;
}

export interface IConversationRepository {
  get(id: string): Conversation | undefined;
  list(): Conversation[];
  save(conversation: Conversation): void;
  delete(id: string): void;
  subscribe(callback: () => void): () => void;
}

export interface IProjectRepository {
  get(id: string): Project | undefined;
  list(): Project[];
  save(project: Project): void;
  delete(id: string): void;
  subscribe(callback: () => void): () => void;
}

class EventEmitter {
  private listeners: (() => void)[] = [];

  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  protected emit() {
    this.listeners.forEach((l) => l());
  }
}

export class LocalStorageConversationRepository extends EventEmitter implements IConversationRepository {
  private readonly STORAGE_KEY = 'orchestray_conversations';
  private data: Map<string, Conversation> = new Map();

  constructor() {
    super();
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed: Conversation[] = JSON.parse(stored);
        this.data = new Map(parsed.map((c) => [c.id, c]));
      }
    } catch (e) {
      console.error('Failed to load conversations from local storage', e);
    }
  }

  private persist() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.data.values())));
      this.emit();
    } catch (e) {
      console.error('Failed to persist conversations to local storage', e);
    }
  }

  get(id: string): Conversation | undefined {
    return this.data.get(id);
  }

  list(): Conversation[] {
    return Array.from(this.data.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  save(conversation: Conversation): void {
    this.data.set(conversation.id, conversation);
    this.persist();
  }

  delete(id: string): void {
    this.data.delete(id);
    this.persist();
  }
}

export class LocalStorageProjectRepository extends EventEmitter implements IProjectRepository {
  private readonly STORAGE_KEY = 'orchestray_projects';
  private data: Map<string, Project> = new Map();

  constructor() {
    super();
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed: Project[] = JSON.parse(stored);
        this.data = new Map(parsed.map((p) => [p.id, p]));
      }
    } catch (e) {
      console.error('Failed to load projects from local storage', e);
    }
  }

  private persist() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.data.values())));
      this.emit();
    } catch (e) {
      console.error('Failed to persist projects to local storage', e);
    }
  }

  get(id: string): Project | undefined {
    return this.data.get(id);
  }

  list(): Project[] {
    return Array.from(this.data.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  save(project: Project): void {
    this.data.set(project.id, project);
    this.persist();
  }

  delete(id: string): void {
    this.data.delete(id);
    this.persist();
  }
}

export class LocalStorageSettingsRepository extends EventEmitter implements ISettingsRepository {
  private readonly STORAGE_KEY = 'orchestray_settings';
  private data: Settings = {
    theme: 'system',
    language: 'English',
    model: 'openrouter/google/gemini-2.5-flash',
    notifications: true,
  };

  constructor() {
    super();
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.data = { ...this.data, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load settings from local storage', e);
    }
  }

  private persist() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
      this.emit();
    } catch (e) {
      console.error('Failed to persist settings to local storage', e);
    }
  }

  get(): Settings {
    return this.data;
  }

  save(settings: Partial<Settings>): void {
    this.data = { ...this.data, ...settings };
    this.persist();
  }
}

export interface IQuerySessionRepository {
  get(id: string): QuerySession | undefined;
  list(): QuerySession[];
  save(session: QuerySession): void;
  delete(id: string): void;
  subscribe(callback: () => void): () => void;
}

export class LocalStorageQuerySessionRepository extends EventEmitter implements IQuerySessionRepository {
  private readonly STORAGE_KEY = 'orchestray_query_sessions';
  private data: Map<string, QuerySession> = new Map();

  constructor() {
    super();
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed: QuerySession[] = JSON.parse(stored);
        this.data = new Map(parsed.map((q) => [q.id, q]));
      }
    } catch (e) {
      console.error('Failed to load query sessions from local storage', e);
    }
  }

  private persist() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.data.values())));
      this.emit();
    } catch (e) {
      console.error('Failed to persist query sessions to local storage', e);
    }
  }

  get(id: string): QuerySession | undefined {
    return this.data.get(id);
  }

  list(): QuerySession[] {
    return Array.from(this.data.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  save(session: QuerySession): void {
    this.data.set(session.id, session);
    this.persist();
  }

  delete(id: string): void {
    this.data.delete(id);
    this.persist();
  }
}

export interface IAuditLogRepository {
  get(id: string): AuditLog | undefined;
  list(): AuditLog[];
  save(log: AuditLog): void;
  subscribe(callback: () => void): () => void;
}

export class LocalStorageAuditLogRepository extends EventEmitter implements IAuditLogRepository {
  private readonly STORAGE_KEY = 'orchestray_audit_logs';
  private data: Map<string, AuditLog> = new Map();

  constructor() {
    super();
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed: AuditLog[] = JSON.parse(stored);
        this.data = new Map(parsed.map((a) => [a.eventId, a]));
      }
    } catch (e) {
      console.error('Failed to load audit logs from local storage', e);
    }
  }

  private persist() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.data.values())));
      this.emit();
    } catch (e) {
      console.error('Failed to persist audit logs to local storage', e);
    }
  }

  get(id: string): AuditLog | undefined {
    return this.data.get(id);
  }

  list(): AuditLog[] {
    return Array.from(this.data.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  save(log: AuditLog): void {
    this.data.set(log.eventId, log);
    this.persist();
  }
}
