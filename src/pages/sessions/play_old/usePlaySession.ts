import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { sessionApi } from '../../../api/services/session';
import { sceneApi } from '../../../api/services/scene';
import { campaignApi } from '../../../api/services/campaign';
import type { Adventure, CampaignDetail, SceneDetail, SessionDetail, SessionPlayer } from '../../../types';

type Phase = 'loading' | 'campaign-intro' | 'storytelling' | 'table';

/**
 * Máquina de estados única da Mesa de Jogo Ativa (rota /app/sessions/:id/play):
 *
 * 'campaign-intro' — conteúdo absorvido de TimelinePage.tsx (spec 00190):
 *   título da campanha, áudio de introdução geral, avatares dos heróis
 *   participantes e CTA. Ao clicar no CTA (ver `enterStorytelling`), grava o
 *   evento de progresso `campaign` para o jogador atual e avança para
 *   'storytelling' sem navegação de rota.
 * 'storytelling' — overlay cinemático do capítulo (spec 00153), inalterado.
 * 'table' — Mesa de Jogo Ativa (`ActiveTable`), inalterada.
 *
 * Fonte de verdade da fase (spec A00153/A00190, be-rpg PR #69):
 * GET /sessions/:id/players-target retorna os alvos de progresso do
 * JOGADOR AUTENTICADO ATUAL nesta sessão (`session_player_id` já resolvido
 * pelo backend a partir do JWT — substitui a checagem antiga por
 * `session_events`/`narrative_entered`, que não permitia checar por jogador
 * específico):
 * - Sem alvo `target_type === 'campaign'` → 'campaign-intro'.
 * - Com `campaign` mas sem `target_type === 'adventure'` com
 *   `target_id === session.current_adventure_id` → 'storytelling'.
 * - Com ambos → 'table'.
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
      .getForSession(sessionId, sceneId)
      .then(setScene)
      .catch((err) => {
        console.error('Failed to load current scene:', err);
        setError('Não foi possível carregar a cena atual.');
      });
  }, [sessionId]);

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

    Promise.all([sessionApi.get(sessionId), sessionApi.getPlayerTargets(sessionId)])
      .then(([sessionData, playerTargets]) => {
        setSession(sessionData);

        if (sessionData.status === 'lobby') {
          setLocation(`/app/sessions/${sessionId}/lobby`);
          return;
        }

        const hasEnteredCampaign = playerTargets.some((target) => target.target_type === 'campaign');
        const hasEnteredAdventure = playerTargets.some(
          (target) =>
            target.target_type === 'adventure' && target.target_id === sessionData.current_adventure_id
        );

        if (hasEnteredCampaign && hasEnteredAdventure) {
          setPhase('table');
          if (sessionData.current_scene_id) {
            return loadScene(sessionData.current_scene_id);
          }
          return;
        }

        if (hasEnteredCampaign) {
          setPhase('storytelling');
          sessionApi.getAdventure(sessionId).then(setAdventure).catch((err) => {
            console.error('Failed to load adventure for storytelling:', err);
          });
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
  // introdução. Grava o evento de progresso 'campaign' do jogador atual antes
  // de avançar. Sem navegação de rota (já estamos em /play).
  const enterStorytelling = useCallback(() => {
    if (!sessionId || !session) return;
    sessionApi
      .createPlayerTarget(sessionId, {
        target_type: 'campaign',
        target_id: session.campaign_id,
      })
      .catch((err) => {
        console.error('Failed to log campaign player target:', err);
      });
    setPhase('storytelling');
    sessionApi.getAdventure(sessionId).then(setAdventure).catch((err) => {
      console.error('Failed to load adventure for storytelling:', err);
    });
  }, [sessionId, session]);

  const enterTable = useCallback(() => {
    if (!session) return Promise.resolve();
    return sessionApi
      .createPlayerTarget(sessionId, {
        target_type: 'adventure',
        target_id: session.current_adventure_id ?? '',
      })
      .catch((err) => {
        console.error('Failed to log adventure player target:', err);
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
