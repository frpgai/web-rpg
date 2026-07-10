import { useCallback, useEffect, useState } from 'react';
import { sessionApi } from '../api/services/session';
import { useSessionEventStream } from './useSessionEventStream';

/**
 * Estado de "há evento não revelado" na cena atual (be-rpg PR #75,
 * GET .../events/notify) — alimenta o badge de notificação da
 * `SessionBottomNav`.
 *
 * O canal "reativo" é uma conexão SSE (be-rpg PR #75,
 * GET .../events/stream) que dispara um refetch do endpoint de notify
 * a cada mensagem `notify` recebida, além do fetch inicial ao montar.
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

  const streamPath =
    sessionId && sceneId ? `sessions/${sessionId}/scenes/${sceneId}/events/stream` : null;
  useSessionEventStream(streamPath, refresh);

  return { hasUnread, refresh };
}
