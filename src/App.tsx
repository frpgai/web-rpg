import { Switch, Route } from 'wouter';
import { Router } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import LandingPage from './pages/LandingPage';
// import { PrivateRoute } from './components/common/PrivateRoute';
import './App.css';

export default function App() {
  return (
    <Router hook={useHashLocation}>
      <Switch>
        {/* Rotas públicas */}
        <Route path="/" component={LandingPage} />
        {/* TODO: <Route path="/login" component={LoginPage} /> */}
        {/* TODO: <Route path="/register" component={RegisterPage} /> */}

        {/* Rotas privadas */}
        {/* TODO: <Route path="/dashboard">
          <PrivateRoute><DashboardPage /></PrivateRoute>
        </Route> */}

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
