import { useState, MouseEvent } from 'react';
import {
  GitBranch,
  Network,
  ShieldCheck,
  BarChart3,
  ScrollText,
  Settings,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  MessageSquarePlus,
  History,
  FolderOpen,
  Search,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Folder,
  Trash,
  type LucideIcon,
} from 'lucide-react';
import type { Route } from '@/lib/router';
import { cn } from '@/lib/utils';
import { Wordmark } from './Logo';
import { useConversations, useProjects, type Conversation, type Project, useActiveState, useStorage } from '@/lib/storage';

const DEV_TOOLS_NAV: { id: Route['name']; label: string; icon: LucideIcon }[] = [
  { id: 'routing', label: 'AI Routing', icon: GitBranch },
  { id: 'consensus', label: 'Consensus Engine', icon: Network },
  { id: 'verification', label: 'Verification Center', icon: ShieldCheck },
  { id: 'models', label: 'Model Performance', icon: BarChart3 },
  { id: 'audit', label: 'Audit Logs', icon: ScrollText },
  { id: 'admin', label: 'Enterprise Admin', icon: Building2 },
];

function groupConversations(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const last7Days = today - 86400000 * 7;

  const groups: Record<string, Conversation[]> = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Older': []
  };

  conversations.forEach(c => {
    if (c.updatedAt >= today) groups['Today'].push(c);
    else if (c.updatedAt >= yesterday) groups['Yesterday'].push(c);
    else if (c.updatedAt >= last7Days) groups['Previous 7 Days'].push(c);
    else groups['Older'].push(c);
  });

  return groups;
}

export function Sidebar({
  route,
  navigate,
  collapsed,
  onToggle
}: {
  route: Route;
  navigate: (n: Route['name']) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(false);
  
  const conversations = useConversations();
  const projects = useProjects();
  const { activeConversationId, setActiveConversationId, startNewChat } = useActiveState();
  const { conversations: convRepo } = useStorage();
  
  const conversationGroups = groupConversations(conversations);

  const handleNewChat = () => {
    navigate('workspace');
    startNewChat();
  };

  const handleSelectChat = (id: string) => {
    navigate('workspace');
    setActiveConversationId(id);
  };

  const handleDeleteChat = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    convRepo.delete(id);
    if (activeConversationId === id) {
      startNewChat();
      navigate('workspace');
    }
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-line bg-ink-50/50 transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-[260px]',
      )}
    >
      <div className={cn('flex h-14 items-center border-b border-line px-4', collapsed && 'justify-center px-0')}>
        {collapsed ? <Wordmark className="opacity-0 hidden" /> : <Wordmark />}
        {collapsed && (
          <button onClick={onToggle} className="text-ink-950">
            <span className="text-base font-bold">O</span>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2 space-y-6">
        <div className="space-y-1">
          <button
            onClick={handleNewChat}
            title={collapsed ? 'New Chat' : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors border border-transparent text-ink-900 hover:bg-white',
              collapsed && 'justify-center px-2',
              route.name === 'workspace' && !activeConversationId && 'bg-white shadow-sm border-line'
            )}
          >
            <MessageSquarePlus size={16} className="shrink-0" />
            {!collapsed && <span className="truncate">New Chat</span>}
          </button>
          
          <button
            onClick={() => navigate('search')}
            title={collapsed ? 'Search' : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors border border-transparent text-ink-600 hover:bg-white hover:text-ink-900',
              collapsed && 'justify-center px-2'
            )}
          >
            <Search size={16} className="shrink-0" />
            {!collapsed && <span className="truncate">Search</span>}
          </button>
        </div>

        {/* Projects Section */}
        <div>
          {!collapsed ? (
            <button
              onClick={() => setProjectsOpen(!projectsOpen)}
              className="flex w-full items-center justify-between px-3 pb-2 text-2xs font-semibold uppercase tracking-[0.1em] text-ink-400 hover:text-ink-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FolderOpen size={14} /> Projects
              </div>
              {projectsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <div className="flex justify-center px-2 pb-2 text-ink-400"><FolderOpen size={16} /></div>
          )}
          
          {!collapsed && projectsOpen && (
            <div className="space-y-0.5 mt-1">
              {projects.length === 0 ? (
                <div className="px-3 py-2 text-xs text-ink-400 text-center">No projects yet</div>
              ) : (
                projects.map((p) => (
                  <button
                    key={p.id}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-white hover:text-ink-900 transition-colors"
                  >
                    <Folder size={14} className="shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* History Section */}
        <div>
          {!collapsed ? (
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="flex w-full items-center justify-between px-3 pb-2 text-2xs font-semibold uppercase tracking-[0.1em] text-ink-400 hover:text-ink-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                <History size={14} /> History
              </div>
              {historyOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <div className="flex justify-center px-2 pb-2 text-ink-400"><History size={16} /></div>
          )}
          
          {!collapsed && historyOpen && (
            <div className="space-y-4 mt-1">
              {Object.entries(conversationGroups).map(([group, convos]) => (
                convos.length > 0 && (
                  <div key={group}>
                    <div className="px-3 py-1 text-2xs font-semibold text-ink-400">{group}</div>
                    <div className="space-y-0.5">
                      {convos.map(c => (
                        <div key={c.id} className="group relative flex items-center">
                          <button
                            onClick={() => handleSelectChat(c.id)}
                            className={cn(
                              "flex flex-1 items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-left transition-colors pr-8",
                              activeConversationId === c.id 
                                ? "bg-ink-100 text-ink-900 font-medium" 
                                : "text-ink-600 hover:bg-white hover:text-ink-900"
                            )}
                          >
                            <span className="truncate">{c.title || 'New Chat'}</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteChat(e, c.id)}
                            className={cn(
                              "absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-ink-200 text-ink-400 hover:text-ink-900",
                              activeConversationId === c.id && "opacity-100"
                            )}
                            title="Delete Chat"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
              {conversations.length === 0 && (
                <div className="px-3 py-2 text-xs text-ink-400 text-center">No history yet</div>
              )}
            </div>
          )}
        </div>

        {/* Settings & Developer Tools */}
        <div className="pt-4 border-t border-line space-y-4">
          <div className="space-y-0.5">
            <button
              onClick={() => navigate('settings')}
              title={collapsed ? 'Settings' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors border border-transparent text-ink-600 hover:bg-white hover:text-ink-900',
                collapsed && 'justify-center px-2',
                route.name === 'settings' && 'bg-white shadow-sm border-line text-ink-900'
              )}
            >
              <Settings size={16} className="shrink-0" />
              {!collapsed && <span className="truncate">Settings</span>}
            </button>
          </div>

          <div>
            {!collapsed ? (
              <button
                onClick={() => setDevToolsOpen(!devToolsOpen)}
                className="flex w-full items-center justify-between px-3 pb-2 text-2xs font-semibold uppercase tracking-[0.1em] text-ink-400 hover:text-ink-900 transition-colors"
              >
                Developer Tools
                {devToolsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
               <div className="px-3 pb-2 text-2xs font-semibold uppercase tracking-[0.1em] text-ink-400 text-center">Dev</div>
            )}
            
            {(devToolsOpen || collapsed) && (
              <div className="space-y-0.5 mt-1">
                {DEV_TOOLS_NAV.map((item) => {
                  const active = route.name === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                        collapsed && 'justify-center px-2',
                        active
                          ? 'bg-white shadow-sm border border-line text-ink-900'
                          : 'border border-transparent text-ink-600 hover:bg-white hover:text-ink-900',
                      )}
                    >
                      <Icon size={16} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="border-t border-line p-2">
        <button
          onClick={onToggle}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-ink-500 hover:bg-ink-100 hover:text-ink-900',
            collapsed && 'justify-center',
          )}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          {!collapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );
}
