import { useEffect, useRef } from 'react';
import type { SessionEvent } from '../../../../../../types';
import './EventImmersiveOverlay.css';

type Props = {
  event: SessionEvent;
  onClose: () => void;
};

// Overlay imersivo para eventos `dice_roll` recebidos via envelope de
// session_events do WebSocket (be-rpg PR #74) — caminho DORMENTE hoje, pois
// nenhum fluxo real emite session_events tipo dice_roll em tempo real ainda
// (rolagens reais seguem 100% via DiceRollOverlay/useDiceRollStore/WS
// roll_resolved, intocados). Implementado literalmente conforme o contrato
// para quando esse caminho for ativado no backend.
const AUTO_CLOSE_MS = 4500;

export function EventImmersiveOverlay({ event, onClose }: Props) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [event, onClose]);

  const modifier = event.modifier ?? 0;
  const total = event.total ?? (event.roll ?? 0) + modifier;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="event-immersive-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="event-immersive-overlay-panel">
        <span className="event-immersive-overlay-label">
          {event.skill_check ?? 'Rolagem de Dados'}
        </span>

        <div className="event-immersive-overlay-die">
          <span className="material-symbols-outlined event-immersive-overlay-die-icon">
            pentagon
          </span>
          <span className="event-immersive-overlay-die-value">{event.roll ?? '?'}</span>
        </div>

        <div className="event-immersive-overlay-calc">
          <span>{event.roll ?? '?'}</span>
          <span>{modifier >= 0 ? '+' : ''}{modifier}</span>
          <span>=</span>
          <span className="event-immersive-overlay-total">{total}</span>
        </div>

        {event.hero_id && (
          <span className="event-immersive-overlay-hero">Herói {event.hero_id}</span>
        )}

        {typeof event.success === 'boolean' && (
          <span
            className={`event-immersive-overlay-result ${
              event.success
                ? 'event-immersive-overlay-result-success'
                : 'event-immersive-overlay-result-failure'
            }`}
          >
            {event.success ? 'Sucesso' : 'Falha'}
          </span>
        )}

        <button
          type="button"
          className="event-immersive-overlay-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
}
