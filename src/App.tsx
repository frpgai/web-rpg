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
import SelectSystemPage from './pages/SelectSystemPage';
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
        {/* Rotas públicas */}
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />


        {/* Rotas privadas */}
        <Route path="/dashboard">
          <PrivateRoute><DashboardPage /></PrivateRoute>
        </Route>
        <Route path="/hero/create/origins">
          <PrivateRoute><OriginsPage /></PrivateRoute>
        </Route>
        <Route path="/hero/create/attributes">
          <PrivateRoute><AttributesPage /></PrivateRoute>
        </Route>
        <Route path="/heroes/create/attributes/:id">
          <PrivateRoute><AttributesPage /></PrivateRoute>
        </Route>
        <Route path="/hero/create/aesthetics">
          <PrivateRoute><AestheticsPage /></PrivateRoute>
        </Route>
        <Route path="/hero/create/aesthetics/:id">
          <PrivateRoute><AestheticsPage /></PrivateRoute>
        </Route>

        <Route path="/select-system">
          <PrivateRoute><SelectSystemPage /></PrivateRoute>
        </Route>

        {/* Fallback */}
        <Route>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>404</h1>
            <p>Página não encontrada.</p>
          </div>
        </Route>
      </Switch>
    </Router>
  );
}
