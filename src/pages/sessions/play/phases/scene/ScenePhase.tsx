import { useCallback, useEffect, useState } from 'react';
import { sessionApi } from '../../../../../api/services/session';
import { sceneApi } from '../../../../../api/services/scene';
import { useSessionSocket } from '../../../../../hooks/useSessionSocket';
import { Spinner } from '../../../../../components/ui/Spinner';
import { SessionHeader } from '../../../../../components/navigation/SessionHeader';
import { MapViewer } from './MapViewer';
import { TimelineFeed } from './events/TimelineFeed';
import { EventImmersiveOverlay } from './events/EventImmersiveOverlay';
import { ActionDock } from './ActionDock';
import { NPCDialogueModal } from './NPCDialogueModal';
import { InvestigateModal } from './InvestigateModal';
import { POIDetailSheet } from './POIDetailSheet';
import type { SceneDetail, SceneNPC, ScenePointOfInterest, SessionDetail, SessionEvent } from '../../../../../types';
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
  // "Mover" não tem endpoint de persistência dedicado hoje (a spec não exige
  // persistência para movimento, só para investigação) — exibimos apenas
  // feedback local em vez de inventar um cálculo/endpoint no frontend
  // (proibido pela Regra de Ouro em web-rpg/CLAUDE.md). Documentado como
  // limitação.
  const [poiNotice, setPoiNotice] = useState<{ poi: ScenePointOfInterest; kind: 'move' } | null>(null);
  // POI selecionado ao clicar num pin no mapa (fora do modo dev) — abre a
  // bottom sheet de detalhes (spec 00153-mesa-jogo/scene.md seção 3.1).
  const [selectedPoi, setSelectedPoi] = useState<ScenePointOfInterest | null>(null);
  // Evento dice_roll recebido via envelope de session_events (be-rpg PR #74)
  // — dispara o EventImmersiveOverlay. Caminho DORMENTE hoje: nenhum fluxo
  // real emite este envelope em tempo real ainda (separado e independente do
  // DiceRollOverlay/useDiceRollStore/WS roll_resolved, que continua intocado).
  const [immersiveEvent, setImmersiveEvent] = useState<SessionEvent | null>(null);

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
        justDiscoveredPoiId={justDiscoveredPoiId}
        onPoiClick={(poiId) => {
          const poi = scene.points_of_interest.find((p) => p.id === poiId) ?? null;
          setSelectedPoi(poi);
        }}
      />

      <TimelineFeed scene={scene} events={events} loading={eventsLoading} />

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
          onClose={() => setSelectedPoi(null)}
          onMove={() => {
            setPoiNotice({ poi: selectedPoi, kind: 'move' });
            setSelectedPoi(null);
          }}
          onInvestigate={() => {
            setInvestigateOpen(true);
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
