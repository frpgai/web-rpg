import { useCallback, useEffect, useState } from 'react';
import { sessionApi } from '../../../../../../api/services/session';
import { sceneApi } from '../../../../../../api/services/scene';
import { interactionApi, type InteractionAction } from '../../../../../../api/services/interaction';
import { useInteractionsStream } from '../../../../../../hooks/useInteractionsStream';
import { useAuthStore } from '../../../../../../stores/authStore';
import { useDiceRollStore } from '../../../../../../stores/diceRollStore';
import type {
  SceneDetail,
  SceneNPC,
  ScenePointOfInterest,
  SessionDetail,
  SessionEvent,
  SessionPlayerDetail,
} from '../../../../../../types';
import { usePlayersStream } from './usePlayersStream';
import { useSessionEventStream } from '../../../../../../hooks/useSessionEventStream';
import { toast } from 'react-toastify';


/**
 * Concentra todo o estado, efeitos de montagem, handlers de ação e conexões
 * de rede da fase "scene" (spec 00190) — extraído de `ScenePhase.tsx` para
 * manter o componente focado apenas em renderização.
 */
export function useScenePhase(sessionId: string, session: SessionDetail) {
  const [scene, setScene] = useState<SceneDetail | null>(null);
  const [sceneLoading, setSceneLoading] = useState(true);
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [activeNpc, setActiveNpc] = useState<SceneNPC | null>(null);
  const [investigateOpen, setInvestigateOpen] = useState(false);
  const [investigatePresetPoi, setInvestigatePresetPoi] = useState<ScenePointOfInterest | null>(null);
  // POI recém-descoberto por uma investigação bem-sucedida nesta sessão de
  // tela (spec A00153 seção 4.3, passo 6) — usado para acionar o pulso
  // luminoso dourado do pin no MapViewer apenas na primeira renderização
  // após a descoberta.
  const [justDiscoveredPoiId, setJustDiscoveredPoiId] = useState<string | null>(null);
  // Toast de feedback de movimento — exibido enquanto a chamada real a
  // `sessionApi.movePlayer` (plano 00008-mover-jogador-no-mapa, item C) está
  // em andamento/concluída.
  const [poiNotice, setPoiNotice] = useState<{ poi: ScenePointOfInterest; kind: 'move' } | null>(null);
  // POI selecionado ao clicar num pin no mapa (fora do modo dev) — abre a
  // bottom sheet de detalhes (spec 00153-mesa-jogo/scene.md seção 3.1).
  const [selectedPoi, setSelectedPoi] = useState<ScenePointOfInterest | null>(null);
  // Ações ativas do POI selecionado, retornadas pelo motor de interações
  // (GET /actions) — plano 00009-acoes-dinamicas-interaction-engine, item B.
  // Substitui a antiga verificação local de proximidade/coordenadas.
  const [poiActions, setPoiActions] = useState<InteractionAction[]>([]);
  // Evento dice_roll recebido via envelope de session_events (be-rpg PR #74)
  // — dispara o EventImmersiveOverlay. Caminho DORMENTE hoje: nenhum fluxo
  // real emite este envelope em tempo real ainda (separado e independente do
  // DiceRollOverlay/useDiceRollStore/WS roll_resolved, que continua intocado).
  const [immersiveEvent, setImmersiveEvent] = useState<SessionEvent | null>(null);
  // Jogadores da sessão — usado por `TimelineFeed` para resolver `hero_id` em
  // nome do herói na linha de `scene_investigation` (be-rpg PR #76), mesmo
  // padrão de `useNpcGroupConversations.ts` (sessionApi.getPlayers).
  const [players, setPlayers] = useState<SessionPlayerDetail[]>([]);
  const currentUserId = useAuthStore((s) => s.user?.id);


  const loadScene = useCallback(() => {
    if (!session.current_scene_id) {
      setSceneLoading(false);
      return Promise.resolve();
    }
    setSceneLoading(true);
    return sceneApi
      .getForSession(sessionId, session.current_scene_id)
      .then(setScene)
      .catch((err) => {
        console.error('Failed to load current scene:', err);
        setSceneError('Não foi possível carregar a cena atual.');
      })
      .finally(() => setSceneLoading(false));
  }, [sessionId, session.current_scene_id]);

  useEffect(() => {
    loadScene();
  }, [loadScene]);

  const fetchEvents = useCallback(() => {
    if (!scene?.id) return;
    setEventsLoading(true);
    sessionApi
      .getEvents(sessionId, scene.id)
      .then((page) => setEvents(page.items))
      .catch((err) => console.error('Failed to load scene events:', err))
      .finally(() => setEventsLoading(false));
  }, [sessionId, scene?.id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, scene?.id]);

  const loadPlayers = useCallback(() => {
    return sessionApi
      .getPlayers(sessionId)
      .then(setPlayers)
      .catch((err) => console.error('Failed to load session players:', err));
  }, [sessionId]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  // Movimentação real do jogador para um POI (plano 00008-mover-jogador-no-mapa,
  // item C) — substitui o toast temporário anterior. Confia puramente nas streams
  // reativas (SSE) de players e eventos que já escutam as mudanças em tempo real.
  const handleMovePlayer = useCallback(
    (poi: ScenePointOfInterest) => {
      setPoiNotice({ poi, kind: 'move' });
      sessionApi
        .movePlayer(sessionId, 'poi', poi.id)
        .catch((err) => console.error('Failed to move player:', err));
    },
    [sessionId]
  );

  // Ação "Abrir" (slug 'open', motor de interações — plano
  // 00009-acoes-dinamicas-interaction-engine) — interação sem rolagem sobre o
  // POI selecionado. Reaproveita interactionApi.interact já usado por
  // InvestigateModal, com roll_type 'normal' por não haver skill check aqui.
  const handleOpenPoi = useCallback(
    (poi: ScenePointOfInterest) => {
      interactionApi
        .interact(sessionId, {
          target_type: 'poi',
          target_id: poi.id,
          action: 'open',
          roll_type: 'normal',
        })
        .then(() => Promise.all([loadScene(), fetchEvents()]))
        .catch((err) => console.error('Failed to open POI:', err));
    },
    [sessionId, loadScene, fetchEvents]
  );

  // Fallback genérico para slugs de ação futuros não tratados explicitamente
  // (pedido do usuário) — dispara a mesma interação sem rolagem, parametrizada
  // pelo slug recebido do backend.
  const handleGenericPoiAction = useCallback(
    (poi: ScenePointOfInterest, slug: string) => {
      interactionApi
        .interact(sessionId, {
          target_type: 'poi',
          target_id: poi.id,
          action: slug,
          roll_type: 'normal',
        })
        .then(() => Promise.all([loadScene(), fetchEvents()]))
        .catch((err) => console.error(`Failed to run generic POI action "${slug}":`, err));
    },
    [sessionId, loadScene, fetchEvents]
  );

  // Canal SSE dedicado de players da sessão (be-rpg PR #79, GET .../sessions/
  // {id}/players/stream) — dispara "notify" a cada join/leave/MovePlayer,
  // independente da cena atual. Recarrega apenas a lista de players.
  usePlayersStream(
    sessionId,
    useCallback(
      (dataStr: string) => {
        try {
          const payload = JSON.parse(dataStr);
          if (
            payload &&
            payload.player_id &&
            payload.x_coordinate !== undefined &&
            payload.y_coordinate !== undefined
          ) {
            setPlayers((prev) =>
              prev.map((p) =>
                p.user_id === payload.player_id
                  ? {
                      ...p,
                      x_coordinate: payload.x_coordinate,
                      y_coordinate: payload.y_coordinate,
                    }
                  : p
              )
            );
          } else {
            // Fallback para atualizações de lobby ou payloads vazios (join/leave)
            loadPlayers();
          }
        } catch (err) {
          console.error('Failed to parse players stream message:', err);
          loadPlayers();
        }
      },
      [loadPlayers]
    )
  );


  // Canal SSE dedicado de eventos da cena (be-rpg PR #75, GET .../scenes/{sceneId}/events/stream)
  // — dispara "notify" a cada novo evento gerado na cena, mantendo a timeline
  // do feed de eventos atualizada em tempo real para todos na mesa.
  const sceneEventsStreamPath =
    sessionId && scene?.id ? `sessions/${sessionId}/scenes/${scene.id}/events/stream` : null;
  useSessionEventStream(sceneEventsStreamPath, fetchEvents);

  // Stream SSE dedicado de resolução de interações (be-rpg PR #82, GET
  // .../interactions/stream) — plano 00012-resolucao-imediata-narrativa,
  // item F.A. `roll_resolved` dispara a animação de dados para todos os
  // jogadores da mesa; `narrative`/`roll_failed` só geram feedback visual
  // (toast) para o jogador executor — os demais acompanham a mudança pelo
  // log de eventos da cena (item F.B, stream separado e inalterado).
  useInteractionsStream(sessionId, {
    onRollResolved: (payload) => {
      useDiceRollStore.getState().handleRollResolved(payload);
    },
    onNarrative: (payload) => {
      if (payload.executor_user_id === currentUserId) {
        toast(payload.text);
      }
    },
    onRollFailed: (payload) => {
      if (payload.executor_user_id !== currentUserId) return;
      toast.error(payload.error);
      if (['pending_roll', 'rolling'].includes(useDiceRollStore.getState().rollState)) {
        useDiceRollStore.getState().reset();
      }
    },
  });


  return {
    scene,
    sceneLoading,
    sceneError,
    events,
    eventsLoading,
    activeNpc,
    setActiveNpc,
    investigateOpen,
    setInvestigateOpen,
    investigatePresetPoi,
    setInvestigatePresetPoi,
    justDiscoveredPoiId,
    setJustDiscoveredPoiId,
    poiNotice,
    setPoiNotice,
    selectedPoi,
    setSelectedPoi,
    poiActions,
    setPoiActions,
    immersiveEvent,
    setImmersiveEvent,
    players,
    loadScene,
    fetchEvents,
    loadPlayers,
    handleMovePlayer,
    handleOpenPoi,
    handleGenericPoiAction,
  };
}

