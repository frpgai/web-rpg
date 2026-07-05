import { useEffect } from 'react';
import { useInvestigate } from './useInvestigate';
import type { SceneDetail } from '../../../types';
import './InvestigateModal.css';

type Props = {
  sessionId: string;
  scene: SceneDetail;
  onClose: () => void;
  onEventLogged: () => void;
  onDiscovered: (poiId: string) => void;
};

export function InvestigateModal({ sessionId, scene, onClose, onEventLogged, onDiscovered }: Props) {
  const { eligiblePois, rolling, roll, error, investigate } = useInvestigate(sessionId, scene, (poiId) => {
    onDiscovered(poiId);
    onEventLogged();
  });

  const resolved = roll?.result !== undefined;

  // "Vasculhar o local" (spec A00153 seção 4.3): com exatamente 1 POI oculto
  // elegível, investiga direto nele em vez de pedir para escolher em uma
  // lista de um item só.
  useEffect(() => {
    if (!roll && eligiblePois.length === 1) {
      investigate(eligiblePois[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligiblePois.length]);

  return (
    <div className="investigatemodal-overlay" role="dialog" aria-modal="true">
      <div className="investigatemodal-modal">
        <header className="investigatemodal-header">
          <span className="material-symbols-outlined">search</span>
          <h2 className="investigatemodal-title">Investigar</h2>
          <button type="button" className="investigatemodal-close" onClick={onClose} aria-label="Fechar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="investigatemodal-body">
          {roll ? (
            <div className="investigatemodal-roll">
              <span className="investigatemodal-roll-badge">d20</span>
              <p className="investigatemodal-roll-target">Vasculhando: {roll.poi.name}</p>
              <p className="investigatemodal-roll-value">{roll.roll}</p>
              {rolling && <p className="investigatemodal-roll-status">Rolando...</p>}
              {resolved && roll.result && (
                <p
                  className={`investigatemodal-roll-result ${
                    roll.result.success
                      ? 'investigatemodal-roll-result-success'
                      : 'investigatemodal-roll-result-failure'
                  }`}
                >
                  Total {roll.result.total} — {roll.result.success ? 'Sucesso' : 'Falha'}
                </p>
              )}
              {resolved && (
                <button type="button" className="investigatemodal-done" onClick={onClose}>
                  Fechar
                </button>
              )}
            </div>
          ) : eligiblePois.length === 0 ? (
            <p className="investigatemodal-empty">Nada para investigar aqui.</p>
          ) : (
            <ul className="investigatemodal-list">
              {eligiblePois.map((poi) => (
                <li key={poi.id}>
                  <button
                    type="button"
                    className="investigatemodal-option"
                    onClick={() => investigate(poi)}
                  >
                    Investigar: {poi.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="investigatemodal-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
