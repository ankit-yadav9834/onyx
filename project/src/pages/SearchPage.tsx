import { useState, useMemo } from 'react';
import { Search as SearchIcon, MessageSquare, Folder, Clock, ChevronRight, Activity, ScrollText } from 'lucide-react';
import { useConversations, useProjects, useAppState, useQuerySessions, useAuditLogs } from '@/lib/storage';
import { timeAgo } from '@/lib/utils';
import type { Route } from '@/lib/router';

export function SearchPage({ 
  navigate,
}: { 
  navigate: (n: Route['name']) => void;
}) {
  const [query, setQuery] = useState('');
  const conversations = useConversations();
  const projects = useProjects();
  const querySessions = useQuerySessions();
  const auditLogs = useAuditLogs();
  const { setActiveConversationId, setActiveQuerySessionId } = useAppState();

  const results = useMemo(() => {
    if (!query.trim()) return { conversations: [], projects: [], sessions: [], logs: [] };
    
    const q = query.toLowerCase();
    
    const matchedConversations = conversations.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.messages.some(m => m.content.toLowerCase().includes(q))
    );
    
    const matchedProjects = projects.filter(p => 
      p.name.toLowerCase().includes(q)
    );

    const matchedSessions = querySessions.filter(s =>
      s.userPrompt.toLowerCase().includes(q) ||
      s.finalAnswer?.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );

    const matchedLogs = auditLogs.filter(l =>
      l.eventId.toLowerCase().includes(q) ||
      l.traceId.toLowerCase().includes(q) ||
      (l.promptPreview && l.promptPreview.toLowerCase().includes(q))
    );
    
    return { conversations: matchedConversations, projects: matchedProjects, sessions: matchedSessions, logs: matchedLogs };
  }, [query, conversations, projects, querySessions, auditLogs]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 h-full flex flex-col">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={20} />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations, sessions, logs, and projects..."
          className="w-full rounded-2xl border-2 border-line bg-white py-4 pl-12 pr-4 text-lg font-medium text-ink-900 placeholder:text-ink-300 focus:border-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-900/5 transition-all shadow-sm"
        />
      </div>

      <div className="mt-8 flex-1 overflow-y-auto scrollbar-thin">
        {!query.trim() ? (
          <div className="flex h-40 flex-col items-center justify-center text-ink-400">
            <SearchIcon size={32} className="mb-3 opacity-20" />
            <p className="text-sm font-medium">Type to search your workspace</p>
          </div>
        ) : (
          <div className="space-y-8 pb-12">
            {results.projects.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400 px-1">Projects ({results.projects.length})</h3>
                <div className="grid gap-2">
                  {results.projects.map(p => (
                    <button key={p.id} className="flex items-center justify-between rounded-xl border border-line bg-white p-4 text-left transition-colors hover:border-ink-300 hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-600">
                          <Folder size={18} />
                        </div>
                        <div>
                          <div className="font-semibold text-ink-900">{p.name}</div>
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-500">
                            <Clock size={11} /> Updated {timeAgo(p.updatedAt)}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-ink-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {results.conversations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400 px-1">Conversations ({results.conversations.length})</h3>
                <div className="grid gap-2">
                  {results.conversations.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => {
                        setActiveConversationId(c.id);
                        navigate('workspace');
                      }}
                      className="flex items-center justify-between rounded-xl border border-line bg-white p-4 text-left transition-colors hover:border-ink-300 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-600">
                          <MessageSquare size={18} />
                        </div>
                        <div>
                          <div className="font-semibold text-ink-900">{c.title || 'Untitled Conversation'}</div>
                          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-ink-500">
                            <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(c.updatedAt)}</span>
                            <span>{c.messages.length} messages</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-ink-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {results.sessions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400 px-1">Query Sessions ({results.sessions.length})</h3>
                <div className="grid gap-2">
                  {results.sessions.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => {
                        setActiveQuerySessionId(s.id);
                        navigate('routing');
                      }}
                      className="flex items-center justify-between rounded-xl border border-line bg-white p-4 text-left transition-colors hover:border-ink-300 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-600">
                          <Activity size={18} />
                        </div>
                        <div>
                          <div className="font-semibold text-ink-900">{s.userPrompt}</div>
                          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-ink-500">
                            <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(s.timestamp)}</span>
                            <span className="mono text-[10px]">{s.id}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-ink-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {results.logs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400 px-1">Audit Logs ({results.logs.length})</h3>
                <div className="grid gap-2">
                  {results.logs.map(l => (
                    <button 
                      key={l.eventId} 
                      onClick={() => navigate('audit')}
                      className="flex items-center justify-between rounded-xl border border-line bg-white p-4 text-left transition-colors hover:border-ink-300 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-600">
                          <ScrollText size={18} />
                        </div>
                        <div>
                          <div className="font-semibold text-ink-900 mono text-xs">{l.eventId}</div>
                          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-ink-500">
                            <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(l.timestamp)}</span>
                            <span>{l.promptPreview}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-ink-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {results.projects.length === 0 && results.conversations.length === 0 && results.sessions.length === 0 && results.logs.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center text-ink-400">
                <p className="text-sm font-medium">No results found for "{query}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
