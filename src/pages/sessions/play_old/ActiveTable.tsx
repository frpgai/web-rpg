import { useCallback, useEffect, useState } from 'react';
import { sessionApi } from '../../../api/services/session';
import { useSessionSocket } from '../../../hooks/useSessionSocket';
import { SessionHeader } from '../../../components/navigation/SessionHeader';
import { MapViewer } from './MapViewer';
import { TimelineFeed } from './TimelineFeed';
import { ActionDock } from './ActionDock';
import { NPCDialogueModal } from './NPCDialogueModal';
import { InvestigateModal } from './InvestigateModal';
import { POIDetailSheet } from './POIDetailSheet';
import type { SceneDetail, SceneNPC, ScenePointOfInterest, SessionEvent } from '../../../types';
import { DiceRollOverlay } from '../../../components/dice/DiceRollOverlay';
import { useDiceRollStore } from '../../../stores/diceRollStore';
import './ActiveTable.css';

type Props = {
  sessionId: string;
  sessionName: string;
  scene: SceneDetail;
  onRefreshScene: () => Promise<void> | void;
};

export function ActiveTable({ sessionId, sessionName, scene, onRefreshScene }: Props) {
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

  const fetchEvents = useCallback(() => {
    setEventsLoading(true);
    sessionApi
      .getEvents(sessionId)
      .then((page) => setEvents(page.items))
      .catch((err) => console.error('Failed to load scene events:', err))
      .finally(() => setEventsLoading(false));
  }, [sessionId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, scene.id]);

  useSessionSocket(
    sessionId,
    useCallback((event: any) => {
      if (event.type === 'roll_resolved' && event.payload) {
        useDiceRollStore.getState().handleRollResolved(event.payload);
      } else if (event.type === 'session.poi_discovered' || event.event === 'session.poi_discovered') {
        onRefreshScene();
        const pois = event.payload?.pois || event.pois;
        if (pois && pois.length > 0) {
          setJustDiscoveredPoiId(pois[0].id);
        }
      }
      fetchEvents();
    }, [fetchEvents, onRefreshScene])
  );

  return (
    <div className="activetable-root">
      <SessionHeader title={sessionName} />

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
        <div className="activetable-poi-toast" role="status">
          <span>Deslocando-se para {poiNotice.poi.display_name}...</span>
          <button type="button" onClick={() => setPoiNotice(null)} aria-label="Fechar aviso">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      <DiceRollOverlay />
    </div>
  );
}
