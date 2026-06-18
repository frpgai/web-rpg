import { Switch, Route } from 'wouter';
import { Router } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
// import { PrivateRoute } from './components/common/PrivateRoute';
import './App.css';

export default function App() {
  return (
    <Router hook={useHashLocation}>
      <Switch>
        {/* Rotas públicas */}
        {/* TODO: <Route path="/login" component={LoginPage} /> */}
        {/* TODO: <Route path="/register" component={RegisterPage} /> */}

        {/* Rotas privadas */}
        {/* TODO: <Route path="/dashboard">
          <PrivateRoute><DashboardPage /></PrivateRoute>
        </Route> */}

        {/* Fallback temporário para desenvolvimento */}
        <Route>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>RPG Imersivo</h1>
            <p>Scaffold e rotas base configurados com sucesso.</p>
          </div>
        </Route>
      </Switch>
    </Router>
  );
}
