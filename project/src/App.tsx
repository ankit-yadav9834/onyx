import { useState } from 'react';
import { useRouter } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import { LandingPage } from '@/pages/LandingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { WorkspacePage } from '@/pages/WorkspacePage';
import { ConsensusPage } from '@/pages/ConsensusPage';
import { RoutingPage } from '@/pages/RoutingPage';
import { VerificationPage } from '@/pages/VerificationPage';
import { ModelsPage } from '@/pages/ModelsPage';
import { AuditPage } from '@/pages/AuditPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminPage } from '@/pages/AdminPage';

function App() {
  const { route, navigate } = useRouter();
  const [isTransparencyOpen, setIsTransparencyOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  if (route.name === 'landing') {
    return <LandingPage navigate={navigate} />;
  }

  return (
    <AppShell 
      route={route} 
      navigate={navigate}
      onToggleTransparency={() => setIsTransparencyOpen(t => !t)}
      activeConversationId={activeConversationId}
      onSelectConversation={setActiveConversationId}
    >
      {route.name === 'dashboard' && <DashboardPage navigate={navigate} />}
      {route.name === 'workspace' && (
        <WorkspacePage 
          isTransparencyOpen={isTransparencyOpen} 
          onCloseTransparency={() => setIsTransparencyOpen(false)} 
          activeConversationId={activeConversationId}
          onConversationChange={setActiveConversationId}
        />
      )}
      {route.name === 'consensus' && <ConsensusPage />}
      {route.name === 'routing' && <RoutingPage />}
      {route.name === 'verification' && <VerificationPage />}
      {route.name === 'models' && <ModelsPage />}
      {route.name === 'audit' && <AuditPage />}
      {route.name === 'settings' && <SettingsPage />}
      {route.name === 'admin' && <AdminPage />}
    </AppShell>
  );
}

export default App;
