import type { Conversation, Project } from './models';

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
