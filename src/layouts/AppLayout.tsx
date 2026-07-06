import React from 'react';
import { useLocation } from 'wouter';
import { BottomNav, type BottomNavTab } from '../components/navigation/BottomNav';
import { SessionBottomNav } from '../components/navigation/SessionBottomNav';
import './AppLayout.css';

const TAB_ROUTES: { pattern: RegExp; tab: BottomNavTab }[] = [
  { pattern: /^\/app\/dashboard/, tab: 'home' },
  { pattern: /^\/app\/hero\/[^/]+$/, tab: 'heroes' },
];

// Telas de sessão ativa (Timeline e Mesa de Jogo) usam o SessionBottomNav
// dedicado (Sessão/Chat/World Map/Options), réplica do Stitch (screens
// 5a5d72af972449828dca5c2df0e8ab62 e fa77bf96766d4bbcafa4ea2ff29c6d43) — o
// BottomNav global (home/heroes/social/settings) não existe nesse conjunto
// de telas no design. O regex casa `/app/sessions/:id` (Timeline) e
// `/app/sessions/:id/play` (Storytelling/Mesa de Jogo Ativa), mas exclui
// deliberadamente `/app/sessions/:id/lobby`, que tem seu próprio tratamento
// de navegação. Corrige o bug anterior em que o segmento extra `/play` não
// casava com nenhum regex e a bottom nav simplesmente não aparecia.
const SESSION_ACTIVE_PATTERN = /^\/app\/sessions\/[^/]+(\/play)?$/;

const NAV_DESTINATIONS: Record<BottomNavTab, string> = {
  home:     '/app/dashboard',
  heroes:   '/app/dashboard',
  social:   '/app/dashboard',
  settings: '/app/dashboard',
};

function resolveTab(path: string): BottomNavTab | undefined {
  return TAB_ROUTES.find(({ pattern }) => pattern.test(path))?.tab;
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const isSessionActive = SESSION_ACTIVE_PATTERN.test(location);
  const activeTab = isSessionActive ? undefined : resolveTab(location);

  return (
    <div className="layout-root">
      <main className="layout-content">
        {children}
      </main>

      {isSessionActive && (
        <div className="layout-nav-container">
          <SessionBottomNav />
        </div>
      )}

      {activeTab && (
        <div className="layout-nav-container">
          <BottomNav
            active={activeTab}
            onPress={(tab) => setLocation(NAV_DESTINATIONS[tab])}
          />
        </div>
      )}
    </div>
  );
}
