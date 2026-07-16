import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { sessionApi } from '../../../../api/services/session';
import { useSessionEventStream } from '../../../../hooks/useSessionEventStream';
import { Avatar } from '../../../../components/ui/Avatar';
import './useSessionEventsNotify.css';

interface SessionEventNotifyPayload {
  hero_name: string;
  hero_avatar_url: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
  variables?: Record<string, string>;
}

function EventToast({ heroName, heroAvatarUrl, message }: { heroName: string; heroAvatarUrl: string; message: string }) {
  return (
    <div className="session-event-toast">
      <Avatar url={heroAvatarUrl} name={heroName} size="sm" />
      <div className="session-event-toast-body">
        {heroName && <span className="session-event-toast-hero">{heroName}</span>}
        <span className="session-event-toast-message">{message}</span>
      </div>
    </div>
  );
}

/**
 * Estado de "há evento não revelado" na cena atual (be-rpg PR #75,
 * GET .../events/notify) — alimenta o badge de notificação da
 * `SessionBottomNav`.
 *
 * O canal "reativo" é uma conexão SSE (be-rpg PR #75,
 * GET .../events/stream) que dispara um refetch do endpoint de notify
 * a cada mensagem `notify` recebida, além do fetch inicial ao montar.
 */
export function useSessionEventsNotify(
  sessionId: string | undefined,
  sceneId: string | undefined,
  onEvent?: (dataStr: string) => void
) {
  const [hasUnread, setHasUnread] = useState(false);
  const { t } = useTranslation();

  const refresh = useCallback((dataStr: string) => {
    console.log('useSessionEventsNotify.refresh', { dataStr });
    onEvent?.(dataStr);

    try {
      const event = JSON.parse(dataStr) as SessionEventNotifyPayload;
      const key = event.message.replace(/^event\./, 'events.');
      const message = t(key, event.variables ?? {});
      const notify = toast[event.level] ?? toast.info;
      notify(
        <EventToast
          heroName={event.hero_name}
          heroAvatarUrl={event.hero_avatar_url}
          message={message}
        />
      );
    } catch (err) {
      console.error('Failed to parse SSE event data as JSON:', err, { dataStr });
    }

    if (!sessionId || !sceneId) {
      setHasUnread(false);
      return;
    }
    sessionApi
      .getEventsNotify(sessionId, sceneId)
      .then((res) => setHasUnread(res.has_unread))
      .catch((err) => console.error('Failed to fetch events notify status:', err));
  }, [sessionId, sceneId, onEvent]);

  const streamPath =
    sessionId && sceneId ? `sessions/${sessionId}/scenes/${sceneId}/events/stream` : null;
  useSessionEventStream(streamPath, refresh);

  return { hasUnread, refresh };
}
