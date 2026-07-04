import { useCallback, useEffect, useState } from 'react';
import { sessionApi } from '../../../api/services/session';
import { sceneApi } from '../../../api/services/scene';
import type { Adventure, SceneDetail, SessionDetail } from '../../../types';

type Phase = 'loading' | 'storytelling' | 'table';

/**
 * Decide entre a tela de Storytelling cinemática e a Mesa de Jogo Ativa,
 * verificando se já existe um evento `adventure_started` para a aventura
 * corrente da sessão (spec A00153 seção 2).
 *
 * NOTA (limitação conhecida): o tipo `SessionPlayer` retornado por
 * `GET /sessions/:id/players` não expõe o `session_player.id` (apenas
 * `user_id`), e `SessionEvent.session_player_id` referencia esse id que não
 * temos localmente. Por isso a checagem de "já iniciou" é feita por
 * aventura (qualquer jogador que já registrou `adventure_started` para a
 * aventura corrente pula a cinemática), não estritamente por jogador atual
 * como o texto da spec sugere. Documentado para o líder validar.
 */
export function usePlaySession(sessionId: string) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [scene, setScene] = useState<SceneDetail | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);

  const loadScene = useCallback((sceneId: string) => {
    return sceneApi
      .get(sceneId)
      .then(setScene)
      .catch((err) => {
        console.error('Failed to load current scene:', err);
        setError('Não foi possível carregar a cena atual.');
      });
  }, []);

  const load = useCallback(() => {
    if (!sessionId) return;
    setError(null);

    Promise.all([sessionApi.get(sessionId), sessionApi.getEvents(sessionId, undefined, 100)])
      .then(([sessionData, eventsPage]) => {
        setSession(sessionData);

        const alreadyStarted = eventsPage.items.some(
          (event) =>
            event.type === 'adventure_started' &&
            (event.payload as Record<string, unknown> | null)?.adventure_id ===
              sessionData.current_adventure_id
        );

        if (alreadyStarted) {
          setPhase('table');
          if (sessionData.current_scene_id) {
            return loadScene(sessionData.current_scene_id);
          }
          return;
        }

        setPhase('storytelling');
        return sessionApi.getAdventure(sessionId).then(setAdventure);
      })
      .catch((err) => {
        console.error('Failed to load play session:', err);
        setError('Não foi possível carregar a mesa de jogo.');
      });
  }, [sessionId, loadScene]);

  useEffect(() => {
    load();
  }, [load]);

  const enterTable = useCallback(() => {
    if (!session) return Promise.resolve();
    return sessionApi
      .createEvent(sessionId, {
        type: 'adventure_started',
        payload: { adventure_id: session.current_adventure_id },
      })
      .catch((err) => {
        console.error('Failed to log adventure_started event:', err);
      })
      .finally(() => {
        setPhase('table');
        if (session.current_scene_id) {
          return loadScene(session.current_scene_id);
        }
      });
  }, [session, sessionId, loadScene]);

  const refreshScene = useCallback(() => {
    if (session?.current_scene_id) {
      return loadScene(session.current_scene_id);
    }
    return Promise.resolve();
  }, [session, loadScene]);

  return { session, adventure, scene, phase, error, enterTable, refreshScene };
}
