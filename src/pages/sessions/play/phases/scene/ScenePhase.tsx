import { useCallback, useEffect, useState } from 'react';
import { sessionApi } from '../../../../../api/services/session';
import { sceneApi } from '../../../../../api/services/scene';
import { interactionApi, type InteractionAction } from '../../../../../api/services/interaction';
import { useSessionSocket } from '../../../../../hooks/useSessionSocket';
import { useSessionEventStream } from '../../../../../hooks/useSessionEventStream';
import { Spinner } from '../../../../../components/ui/Spinner';
import { SessionHeader } from '../../../../../components/navigation/SessionHeader';
import { MapViewer } from './MapViewer';
import { TimelineFeed } from './events/TimelineFeed';
import { EventImmersiveOverlay } from './events/EventImmersiveOverlay';
import { ActionDock } from './ActionDock';
import { NPCDialogueModal } from './NPCDialogueModal';
import { InvestigateModal } from './InvestigateModal';
import { POIDetailSheet } from './POIDetailSheet';
import type {
  SceneDetail,
  SceneNPC,
  ScenePointOfInterest,
  SessionDetail,
  SessionEvent,
  SessionPlayerDetail,
} from '../../../../../types';
import { DiceRollOverlay } from '../../../../../components/dice/DiceRollOverlay';
import { useDiceRollStore } from '../../../../../stores/diceRollStore';
import './ScenePhase.css';

type Props = {
  sessionId: string;
  session: SessionDetail;
};

/**
 * Fase "scene" (spec 00190) — mesa de jogo ativa: mapa, feed de narração/log
 * e dock de ações do herói. Adaptado de `play_old/ActiveTable.tsx`, agora
 * responsável por buscar a própria cena atual (`session.current_scene_id`)
 * em vez de recebê-la de um hook de máquina de estados do PlayPage.
 */
export function ScenePhase({ sessionId, session }: Props) {
  const [scene, setScene] = useState<SceneDetail | null>(null);
  const [sceneLoading, setSceneLoading] = useState(true);
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [activeNpc, setActiveNpc] = useState<SceneNPC | null>(null);
  const [investigateOpen, setInvestigateOpen] = useState(false);
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
  // item C) — substitui o toast temporário anterior. Após sucesso, recarrega
  // players (nova posição/POI atual) e eventos (log de movimento) da cena.
  const handleMovePlayer = useCallback(
    (poi: ScenePointOfInterest) => {
      setPoiNotice({ poi, kind: 'move' });
      sessionApi
        .movePlayer(sessionId, 'poi', poi.id)
        .then(() => Promise.all([loadPlayers(), fetchEvents()]))
        .catch((err) => console.error('Failed to move player:', err));
    },
    [sessionId, loadPlayers, fetchEvents]
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

  useSessionSocket(
    sessionId,
    useCallback((event: any) => {
      if (event.type === 'roll_resolved' && event.payload) {
        useDiceRollStore.getState().handleRollResolved(event.payload);
      } else if (event.type === 'session.poi_discovered' || event.event === 'session.poi_discovered') {
        loadScene();
        const pois = event.payload?.pois || event.pois;
        if (pois && pois.length > 0) {
          setJustDiscoveredPoiId(pois[0].id);
        }
      } else if (event.type === 'dice_roll') {
        // Envelope de session_events tipo dice_roll (be-rpg PR #74) — adiciona
        // à timeline local e ativa o overlay imersivo. Não confundir com
        // 'roll_resolved' acima, que segue o fluxo real de DiceRollOverlay.
        const diceEvent = (event.payload ?? event) as SessionEvent;
        setEvents((prev) => [...prev, diceEvent]);
        setImmersiveEvent(diceEvent);
      }
      fetchEvents();
    }, [fetchEvents, loadScene])
  );

  // Canal SSE de eventos da cena (be-rpg PR #75, GET .../scenes/{sceneId}/
  // events/stream) — o WebSocket do useSessionSocket acima nunca emite tipo
  // "notify" (Hub em be-rpg/internal/session/ws.go só emite session_joined/
  // session_left/player_ready_changed/session_started/roll_resolved/
  // roll_failed/narrative/session.poi_discovered). O evento "notify" de
  // verdade (ex: disparado por CreateEvent) vem deste canal SSE, mesmo
  // padrão de useSessionEventsNotify.ts.
  useSessionEventStream(
    scene?.id ? `sessions/${sessionId}/scenes/${scene.id}/events/stream` : null,
    fetchEvents
  );

  // Canal SSE dedicado de players da sessão (be-rpg PR #79, GET .../sessions/
  // {id}/players/stream) — dispara "notify" a cada join/leave/MovePlayer,
  // independente da cena atual. Recarrega apenas a lista de players.
  useSessionEventStream(`sessions/${sessionId}/players/stream`, loadPlayers);

  if (sceneLoading) {
    return (
      <div className="sceneplay-root sceneplay-loading">
        <Spinner color="var(--color-primary)" size="large" />
      </div>
    );
  }

  if (sceneError || !scene) {
    return (
      <div className="sceneplay-root sceneplay-loading">
        <p className="sceneplay-error">{sceneError ?? 'Nenhuma cena ativa nesta sessão.'}</p>
      </div>
    );
  }

  return (
    <div className="sceneplay-root">
      <SessionHeader title={session.name} />

      <MapViewer
        scene={scene}
        players={players}
        justDiscoveredPoiId={justDiscoveredPoiId}
        onPoiClick={(poiId) => {
          const poi = scene.points_of_interest.find((p) => p.id === poiId) ?? null;
          setSelectedPoi(poi);
          setPoiActions([]);
          if (poi) {
            interactionApi
              .getActions(sessionId, 'poi', poi.id)
              .then(setPoiActions)
              .catch((err) => console.error('Failed to load POI actions:', err));
          }
        }}
      />

      <TimelineFeed scene={scene} events={events} loading={eventsLoading} players={players} />

      <ActionDock
        scene={scene}
        hasActiveCombat={false}
        onSpeak={() => setActiveNpc(scene.npcs[0] ?? null)}
        onMove={() => setPoiNotice(scene.points_of_interest[0] ? { poi: scene.points_of_interest[0], kind: 'move' } : null)}
        onInvestigate={() => setInvestigateOpen(true)}
        onCombat={() => {}}
      />

      {activeNpc && (
        <NPCDialogueModal
          sessionId={sessionId}
          sceneId={scene.id}
          npc={activeNpc}
          onClose={() => setActiveNpc(null)}
          onEventLogged={fetchEvents}
        />
      )}

      {investigateOpen && (
        <InvestigateModal sessionId={sessionId} scene={scene} onClose={() => setInvestigateOpen(false)} />
      )}

      {selectedPoi && (
        <POIDetailSheet
          poi={selectedPoi}
          actions={poiActions}
          onClose={() => setSelectedPoi(null)}
          onMove={() => {
            handleMovePlayer(selectedPoi);
            setSelectedPoi(null);
          }}
          onInvestigate={() => {
            setInvestigateOpen(true);
            setSelectedPoi(null);
          }}
          onOpen={() => {
            handleOpenPoi(selectedPoi);
            setSelectedPoi(null);
          }}
          onGenericAction={(slug) => {
            handleGenericPoiAction(selectedPoi, slug);
            setSelectedPoi(null);
          }}
        />
      )}

      {poiNotice && (
        <div className="sceneplay-poi-toast" role="status">
          <span>Deslocando-se para {poiNotice.poi.display_name}...</span>
          <button type="button" onClick={() => setPoiNotice(null)} aria-label="Fechar aviso">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      <DiceRollOverlay />

      {immersiveEvent && (
        <EventImmersiveOverlay event={immersiveEvent} onClose={() => setImmersiveEvent(null)} />
      )}
    </div>
  );
}
