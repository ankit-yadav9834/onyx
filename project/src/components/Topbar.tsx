import { Search, Bell, Command, ChevronDown, Cpu } from 'lucide-react';
import type { Route } from '@/lib/router';

const TITLES: Record<Route['name'], { title: string; sub: string }> = {
  landing: { title: 'OrchestrAI', sub: 'AI Operating System' },
  dashboard: { title: 'Dashboard', sub: 'System overview & live health' },
  workspace: { title: 'Query Workspace', sub: 'Premium AI Assistant' },
  consensus: { title: 'Consensus Engine', sub: 'Multi-model voting & agreement analysis' },
  routing: { title: 'Routing Engine', sub: 'Capability matrix, policies & fallback rules' },
  verification: { title: 'Verification Center', sub: 'Fact-check, hallucination & safety pipeline' },
  models: { title: 'Model Performance', sub: 'Latency, cost, reliability & spend analytics' },
  audit: { title: 'Audit Logs', sub: 'Immutable trail of every action' },
  settings: { title: 'Settings', sub: 'Workspace, API & preferences' },
  admin: { title: 'Enterprise Admin', sub: 'Users, RBAC, policies & compliance' },
  search: { title: 'Search', sub: 'Search across conversations and files' },
};

export function Topbar({ route, onToggleTransparency }: { route: Route; onToggleTransparency?: () => void }) {
  const meta = TITLES[route.name];
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/95 px-6 backdrop-blur-md">
      <div>
        <h1 className="text-sm font-semibold tracking-tight text-ink-950">{meta.title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-lg border border-line bg-ink-50 px-3 py-1.5 text-xs text-ink-400 md:flex">
          <Search size={14} />
          <span className="w-40 text-ink-400">Search...</span>
          <span className="flex items-center gap-0.5 rounded border border-line px-1 text-2xs text-ink-400 bg-white">
            <Command size={10} />K
          </span>
        </div>
        
        {route.name === 'workspace' && (
          <button 
            onClick={onToggleTransparency}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-ink-600 hover:text-ink-900 transition-colors"
          >
            <Cpu size={14} />
            AI Transparency
          </button>
        )}
        
        <button className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink-500 hover:text-ink-900 transition-colors">
          <Bell size={15} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-line bg-white px-2 py-1.5 hover:border-line-dark transition-colors">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-ink-900 text-2xs font-semibold text-ink-50">
            MC
          </div>
          <span className="hidden text-xs font-medium text-ink-700 sm:block">Mira Chen</span>
          <ChevronDown size={13} className="text-ink-400" />
        </button>
      </div>
    </header>
  );
}
