import { useState } from 'react';
import type { Route } from '@/lib/router';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell({ 
  route, 
  navigate, 
  onToggleTransparency,
  children 
}: { 
  route: Route; 
  navigate: (n: Route['name']) => void; 
  onToggleTransparency?: () => void;
  children: React.ReactNode 
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <Sidebar 
        route={route} 
        navigate={navigate} 
        collapsed={collapsed} 
        onToggle={() => setCollapsed((c) => !c)} 
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar route={route} onToggleTransparency={onToggleTransparency} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
