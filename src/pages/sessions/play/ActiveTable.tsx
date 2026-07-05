import { useCallback, useEffect, useState } from 'react';
import { sessionApi } from '../../../api/services/session';
import { useSessionSocket } from '../../../hooks/useSessionSocket';
import { MapViewer } from './MapViewer';
import { TimelineFeed } from './TimelineFeed';
import { ActionDock } from './ActionDock';
import { NPCDialogueModal } from './NPCDialogueModal';
import { InvestigateModal } from './InvestigateModal';
import type { SceneDetail, SceneNPC, ScenePointOfInterest, SessionEvent } from '../../../types';
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
    useCallback(() => fetchEvents(), [fetchEvents])
  );

  return (
    <div className="activetable-root">
      <header className="activetable-header">
        <h1 className="activetable-header-title">{sessionName}</h1>
      </header>

      <MapViewer
        scene={scene}
        onSelectNpc={setActiveNpc}
        onSelectPoi={(poi) => setPoiNotice({ poi, kind: 'move' })}
        justDiscoveredPoiId={justDiscoveredPoiId}
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
        <InvestigateModal
          sessionId={sessionId}
          scene={scene}
          onClose={() => setInvestigateOpen(false)}
          onEventLogged={() => {
            fetchEvents();
            onRefreshScene();
          }}
          onDiscovered={(poiId) => setJustDiscoveredPoiId(poiId)}
        />
      )}

      {poiNotice && (
        <div className="activetable-poi-toast" role="status">
          <span>Deslocando-se para {poiNotice.poi.name}...</span>
          <button type="button" onClick={() => setPoiNotice(null)} aria-label="Fechar aviso">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
