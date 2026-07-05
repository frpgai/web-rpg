import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { sessionApi } from '../../../api/services/session';
import { sceneApi } from '../../../api/services/scene';
import { campaignApi } from '../../../api/services/campaign';
import type { Adventure, CampaignDetail, SceneDetail, SessionDetail, SessionPlayer } from '../../../types';

type Phase = 'loading' | 'campaign-intro' | 'storytelling' | 'table';

// Evento que marca "aventura/capítulo já iniciado" (be-rpg PR #69):
// narrative_entered com entity_type='adventure', entity_id=<adventure_id>,
// substituindo o antigo adventure_started (payload JSONB).
const NARRATIVE_ENTERED_EVENT_TYPE = 'narrative_entered';
const ADVENTURE_ENTITY_TYPE = 'adventure';

/**
 * Máquina de estados única da Mesa de Jogo Ativa (rota /app/sessions/:id/play):
 *
 * 'campaign-intro' — conteúdo absorvido de TimelinePage.tsx (spec 00190):
 *   título da campanha, áudio de introdução geral, avatares dos heróis
 *   participantes e CTA. Fase local, não persistida no backend. Ao clicar no
 *   CTA (ver `enterStorytelling`), avança para 'storytelling' sem navegação
 *   de rota.
 * 'storytelling' — overlay cinemático do capítulo (spec 00153), inalterado.
 * 'table' — Mesa de Jogo Ativa (`ActiveTable`), inalterada.
 *
 * Regra de pulo automático: se já existe um evento `narrative_entered` com
 * entity_type='adventure' para a aventura corrente da sessão, pula direto
 * para 'table', sem passar por 'campaign-intro' nem 'storytelling' (mesma
 * checagem que já existia em usePlaySession antes da fusão).
 *
 * NOTA (limitação conhecida): o tipo `SessionPlayer` retornado por
 * `GET /sessions/:id/players` não expõe o `session_player.id` (apenas
 * `user_id`), e `SessionEvent.session_player_id` referencia esse id que não
 * temos localmente. Por isso a checagem de "já iniciou" é feita por
 * aventura (qualquer jogador que já registrou o evento para a aventura
 * corrente pula a cinemática), não estritamente por jogador atual como o
 * texto da spec sugere. Documentado para o líder validar.
 */
export function usePlaySession(sessionId: string) {
  const [, setLocation] = useLocation();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
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

  const loadCampaignIntroData = useCallback((campaignId: string) => {
    campaignApi
      .getDetail(campaignId)
      .then(setCampaign)
      .catch((err) => console.error('Failed to load campaign for intro:', err));

    sessionApi
      .getPlayers(sessionId)
      .then(setPlayers)
      .catch((err) => console.error('Failed to load session players:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const load = useCallback(() => {
    if (!sessionId) return;
    setError(null);

    Promise.all([sessionApi.get(sessionId), sessionApi.getEvents(sessionId, undefined, 100)])
      .then(([sessionData, eventsPage]) => {
        setSession(sessionData);

        if (sessionData.status === 'lobby') {
          setLocation(`/app/sessions/${sessionId}/lobby`);
          return;
        }

        const alreadyStarted = eventsPage.items.some(
          (event) =>
            event.type === NARRATIVE_ENTERED_EVENT_TYPE &&
            event.entity_type === ADVENTURE_ENTITY_TYPE &&
            event.entity_id === sessionData.current_adventure_id
        );

        if (alreadyStarted) {
          setPhase('table');
          if (sessionData.current_scene_id) {
            return loadScene(sessionData.current_scene_id);
          }
          return;
        }

        setPhase('campaign-intro');
        loadCampaignIntroData(sessionData.campaign_id);
      })
      .catch((err) => {
        console.error('Failed to load play session:', err);
        setError('Não foi possível carregar a mesa de jogo.');
      });
  }, [sessionId, loadScene, loadCampaignIntroData, setLocation]);

  useEffect(() => {
    load();
  }, [load]);

  // Refetch dedicado da campanha, usado quando a URL assinada do áudio de
  // introdução expira (1h) e o elemento <audio> dispara erro de carregamento.
  const refetchCampaign = useCallback(() => {
    if (!session) return Promise.resolve();
    return campaignApi
      .getDetail(session.campaign_id)
      .then(setCampaign)
      .catch((err) => {
        console.error('Failed to refetch campaign for audio URL renewal:', err);
      });
  }, [session]);

  // Avança de 'campaign-intro' para 'storytelling' — clique no CTA da tela de
  // introdução. Sem navegação de rota (já estamos em /play).
  const enterStorytelling = useCallback(() => {
    if (!sessionId) return;
    setPhase('storytelling');
    sessionApi.getAdventure(sessionId).then(setAdventure).catch((err) => {
      console.error('Failed to load adventure for storytelling:', err);
    });
  }, [sessionId]);

  const enterTable = useCallback(() => {
    if (!session) return Promise.resolve();
    return sessionApi
      .createEvent(sessionId, {
        type: NARRATIVE_ENTERED_EVENT_TYPE,
        entity_type: ADVENTURE_ENTITY_TYPE,
        entity_id: session.current_adventure_id ?? undefined,
      })
      .catch((err) => {
        console.error('Failed to log narrative_entered event:', err);
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

  return {
    session,
    campaign,
    players,
    adventure,
    scene,
    phase,
    error,
    refetchCampaign,
    enterStorytelling,
    enterTable,
    refreshScene,
  };
}
