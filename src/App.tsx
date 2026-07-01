import { useEffect } from 'react';
import { Switch, Route } from 'wouter';
import { Router } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import OriginsPage from './pages/hero/create/origins';
import AttributesPage from './pages/hero/create/attributes/AttributesPage';
import AestheticsPage from './pages/hero/create/aesthetics/AestheticsPage';
import SummaryPage from './pages/hero/create/summary/SummaryPage';
import HeroDetailPage from './pages/hero/detail/HeroDetailPage';
import SelectSystemPage from './pages/SelectSystemPage';
import CreateSessionPage from './pages/sessions/CreateSessionPage';
import ConfigureSessionPage from './pages/sessions/ConfigureSessionPage';
import AppLayout from './layouts/AppLayout';
import { PrivateRoute } from './components/common/PrivateRoute';
import { useAuthStore } from './stores/authStore';
import { systemService } from './api/services/systemService';
import { useSystemStore } from './stores/systemStore';
import './App.css';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    systemService.list().then((systems) => {
      if (systems.length === 1) {
        useSystemStore.getState().setCurrentSystem(systems[0]);
      }
    }).catch(() => {
      // non-critical — ignore errors
    });
  }, [isAuthenticated]);

  return (
    <Router hook={useHashLocation}>
      <Switch>
        {/* ==================== 1. ROTAS PÚBLICAS ==================== */}
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />

        {/* ==================== 2. ROTAS PRIVADAS ==================== */}
        <Route path="/app/*">
          <PrivateRoute>
            <AppLayout>
              <Switch>
                <Route path="/app/dashboard" component={DashboardPage} />
                <Route path="/app/hero/:id" component={HeroDetailPage} />

                <Route path="/app/heroes/create/origins" component={OriginsPage} />
                <Route path="/app/hero/create/origins" component={OriginsPage} />

                <Route path="/app/heroes/create/attributes" component={AttributesPage} />
                <Route path="/app/heroes/create/attributes/:id" component={AttributesPage} />
                <Route path="/app/hero/create/attributes" component={AttributesPage} />
                <Route path="/app/hero/create/attributes/:id" component={AttributesPage} />

                <Route path="/app/heroes/create/aesthetics" component={AestheticsPage} />
                <Route path="/app/heroes/create/aesthetics/:id" component={AestheticsPage} />
                <Route path="/app/hero/create/aesthetics" component={AestheticsPage} />
                <Route path="/app/hero/create/aesthetics/:id" component={AestheticsPage} />

                <Route path="/app/heroes/create/summary" component={SummaryPage} />
                <Route path="/app/heroes/create/summary/:id" component={SummaryPage} />
                <Route path="/app/hero/create/summary" component={SummaryPage} />
                <Route path="/app/hero/create/summary/:id" component={SummaryPage} />

                <Route path="/app/select-system" component={SelectSystemPage} />

                <Route path="/app/sessions/create/select-campaign" component={CreateSessionPage} />
                <Route path="/app/sessions/new/configure/:campaignId" component={ConfigureSessionPage} />

                <Route>
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h1>404</h1>
                    <p>Página não encontrada no painel.</p>
                  </div>
                </Route>
              </Switch>
            </AppLayout>
          </PrivateRoute>
        </Route>
      </Switch>
    </Router>
  );
}

