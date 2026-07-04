import React from 'react';
import { useLocation } from 'wouter';
import { BottomNav, type BottomNavTab } from '../components/navigation/BottomNav';
import './AppLayout.css';

const TAB_ROUTES: { pattern: RegExp; tab: BottomNavTab }[] = [
  { pattern: /^\/app\/dashboard/, tab: 'home' },
  { pattern: /^\/app\/hero\/[^/]+$/, tab: 'heroes' },
  // Mesa de Jogo Ativa (/app/sessions/:id/play, que absorveu a antiga rota
  // raiz /app/sessions/:id — TimelinePage foi fundida em PlayPage como fase
  // 'campaign-intro') — a screen Stitch mostra a tab "Mesas" ativa, que não
  // existe no BottomNav atual (home/heroes/social/settings). Mapeada para
  // "home" por ser a tab semanticamente mais próxima de "mesas de jogo"
  // hoje; reportado para validação do usuário. O regex exclui
  // deliberadamente /app/sessions/:id/lobby, que tem seu próprio tratamento
  // de navegação.
  { pattern: /^\/app\/sessions\/[^/]+\/play$/, tab: 'home' },
];

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
  const activeTab = resolveTab(location);

  return (
    <div className="layout-root">
      <main className="layout-content">
        {children}
      </main>

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
