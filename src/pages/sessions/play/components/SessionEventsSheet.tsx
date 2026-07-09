import { useCallback, useEffect, useState } from 'react';
import { sessionApi } from '../../../../api/services/session';
import { Spinner } from '../../../../components/ui/Spinner';
import { EventLogFeed } from './EventLogFeed';
import { EventQueueOverlay } from './EventQueueOverlay';
import type { SessionEvent } from '../../../../types';
import './SessionEventsSheet.css';

type Props = {
  sessionId: string;
  sceneId: string;
  onClose: () => void;
  // Chamado quando a fila de eventos não revelados esgota (passo 5 do fluxo
  // de notificação) — o chamador usa isso para forçar um refetch do badge
  // de `/events/notify`.
  onQueueCleared: () => void;
};

/**
 * BottomSheet "Log de Aventura" (Stitch project 15326270198202696484):
 * - Empty state (screen 1837156ba8ef434b94393f8f0e73cbc4) quando não há
 *   nenhum evento na cena.
 * - Lista ativa (screen c49921ed1df342a3bf33ecdb11daa8ef) via `EventLogFeed`
 *   quando há eventos — cobre 60-80% da altura visível sobre a tela de jogo.
 *
 * Eventos com `revealed === false` formam uma fila processada
 * sequencialmente pelo `EventQueueOverlay` (glassmorphic, sobre o próprio
 * BottomSheet) assim que a lista carrega.
 */
export function SessionEventsSheet({ sessionId, sceneId, onClose, onQueueCleared }: Props) {
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<SessionEvent[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    sessionApi
      .getEvents(sessionId, sceneId)
      .then((page) => {
        setEvents(page.items);
        setQueue(page.items.filter((e) => e.revealed === false));
      })
      .catch((err) => console.error('SessionEventsSheet: failed to load events:', err))
      .finally(() => setLoading(false));
  }, [sessionId, sceneId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleQueueEventResolved(resolvedId: string) {
    setEvents((prev) => prev.map((e) => (e.id === resolvedId ? { ...e, revealed: true } : e)));
  }

  function handleQueueExhausted() {
    setQueue([]);
    onQueueCleared();
  }

  const unreadCount = events.filter((e) => e.revealed === false).length;

  return (
    <div className="sessioneventssheet-backdrop" onClick={handleBackdropClick} role="presentation">
      <div className="sessioneventssheet-root" role="dialog" aria-modal="true" aria-label="Log de Aventura">
        <div className="sessioneventssheet-handle-row">
          <div className="sessioneventssheet-handle" />
        </div>

        <div className="sessioneventssheet-header">
          <div className="sessioneventssheet-header-titles">
            <span className="sessioneventssheet-eyebrow">Feed de Eventos</span>
            <h2 className="sessioneventssheet-title">Log de Aventura</h2>
          </div>
          {unreadCount > 0 && (
            <span className="sessioneventssheet-unread-pill">{unreadCount} novas</span>
          )}
        </div>

        {loading ? (
          <div className="sessioneventssheet-loading">
            <Spinner color="var(--color-primary)" size="large" />
          </div>
        ) : events.length === 0 ? (
          <div className="sessioneventssheet-empty">
            <div className="sessioneventssheet-empty-glow" />
            <span className="material-symbols-outlined sessioneventssheet-empty-icon">menu_book</span>
            <h3 className="sessioneventssheet-empty-title">Grimório de Destinos</h3>
            <p className="sessioneventssheet-empty-quote">
              "As estrelas se alinham para aqueles que buscam a verdade entre as sombras."
            </p>
            <div className="sessioneventssheet-empty-status">
              <span className="sessioneventssheet-empty-status-dot" />
              <p>Sua jornada está tranquila</p>
            </div>
            <button type="button" className="sessioneventssheet-empty-cta" onClick={onClose}>
              <span className="material-symbols-outlined">play_arrow</span>
              Voltar ao Jogo
            </button>
          </div>
        ) : (
          <EventLogFeed events={events} />
        )}
      </div>

      {queue.length > 0 && (
        <EventQueueOverlay
          queue={queue}
          onEventResolved={handleQueueEventResolved}
          onExhausted={handleQueueExhausted}
        />
      )}
    </div>
  );
}
