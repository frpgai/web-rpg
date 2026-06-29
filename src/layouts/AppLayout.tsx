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
