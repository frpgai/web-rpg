import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { systemService } from '../api/services/systemService';
import { userService } from '../api/services/userService';
import { useUserStore } from '../stores/userStore';
import { useSystemStore } from '../stores/systemStore';
import type { System } from '../types';
import './SelectSystemPage.css';

export default function SelectSystemPage() {
  const [, setLocation] = useLocation();
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    systemService
      .list()
      .then(setSystems)
      .catch(() => setError('Não foi possível carregar os sistemas.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSelect(system: System) {
    setSelecting(system.id);
    setError('');
    try {
      const updated = await userService.patchMe({ current_system_id: system.id });
      useUserStore.getState().setUser(updated);
      useSystemStore.getState().setCurrentSystem(system);
      setLocation('/');
    } catch {
      setError('Erro ao selecionar sistema. Tente novamente.');
      setSelecting(null);
    }
  }

  return (
    <div className="select-system-page">
      <div className="select-system-container">
        <h1 className="select-system-title">Selecione um Sistema</h1>
        <p className="select-system-subtitle">
          Escolha o sistema de RPG que deseja utilizar.
        </p>

        {loading && (
          <div className="select-system-loading">
            <div className="select-system-spinner" />
          </div>
        )}

        {error && <p className="select-system-error">{error}</p>}

        {!loading && systems.length === 0 && !error && (
          <p className="select-system-empty">Nenhum sistema disponível.</p>
        )}

        <ul className="select-system-list">
          {systems.map((system) => (
            <li key={system.id}>
              <button
                className="select-system-card"
                onClick={() => handleSelect(system)}
                disabled={selecting !== null}
              >
                <span className="select-system-card-name">{system.name}</span>
                {selecting === system.id && (
                  <span className="select-system-card-spinner" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
