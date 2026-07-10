import { useCallback, useEffect, useState } from 'react';
import { sessionApi } from '../api/services/session';
import { useSessionSocket } from './useSessionSocket';

/**
 * Estado de "há evento não revelado" na cena atual (be-rpg PR #75,
 * GET .../events/notify) — alimenta o badge de notificação da
 * `SessionBottomNav`.
 *
 * Não existe infraestrutura de SSE no projeto (grep confirmou — apenas
 * `useSessionSocket`, um WebSocket nativo já usado por `ScenePhase`); esse
 * hook reutiliza o mesmo WebSocket de sessão como o canal "reativo": qualquer
 * mensagem recebida (rolagem, POI descoberto, narrativa) dispara um refetch
 * do endpoint de notify, além do fetch inicial ao montar.
 */
export function useSessionEventsNotify(sessionId: string | undefined, sceneId: string | undefined) {
  const [hasUnread, setHasUnread] = useState(false);

  const refresh = useCallback(() => {
    if (!sessionId || !sceneId) {
      setHasUnread(false);
      return;
    }
    sessionApi
      .getEventsNotify(sessionId, sceneId)
      .then((res) => setHasUnread(res.has_unread))
      .catch((err) => console.error('Failed to fetch events notify status:', err));
  }, [sessionId, sceneId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useSessionSocket(
    sessionId ?? '',
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { hasUnread, refresh };
}
