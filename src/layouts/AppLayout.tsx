import React from 'react';
import { useLocation } from 'wouter';
import { BottomNav, type BottomNavTab } from '../components/navigation/BottomNav';
import './AppLayout.css';

const TAB_ROUTES: { pattern: RegExp; tab: BottomNavTab }[] = [
  { pattern: /^\/app\/dashboard/, tab: 'home' },
  { pattern: /^\/app\/hero\/[^/]+$/, tab: 'heroes' },
];

const NAV_DESTINATIONS: Record<BottomNavTab, string> = {
  home:     '/app/dashboard',
  heroes:   '/app/dashboard',
  social:   '/app/dashboard',
  settings: '/app/dashboard',
};

function resolveTab(path: string): BottomNavTab {
  return TAB_ROUTES.find(({ pattern }) => pattern.test(path))?.tab ?? 'home';
}

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout do painel (todas as rotas `/app/*` exceto a Mesa de Jogo Ativa, que
 * usa `PlayLayout` — ver `App.tsx`). Sempre renderiza o `BottomNav` global
 * (Home/Heroes/Social/Settings) fixamente; a antiga detecção de rota de
 * sessão ativa (`SESSION_ACTIVE_PATTERN`) foi removida daqui porque essa
 * responsabilidade agora pertence exclusivamente a `PlayLayout`.
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const activeTab = resolveTab(location);

  return (
    <div className="layout-root">
      <main className="layout-content">
        {children}
      </main>

      <div className="layout-nav-container">
        <BottomNav
          active={activeTab}
          onPress={(tab) => setLocation(NAV_DESTINATIONS[tab])}
        />
      </div>
    </div>
  );
}
