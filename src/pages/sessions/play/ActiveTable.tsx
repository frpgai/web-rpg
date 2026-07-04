import { useCallback, useEffect, useState } from 'react';
import { sessionApi } from '../../../api/services/session';
import { useSessionSocket } from '../../../hooks/useSessionSocket';
import { MapViewer } from './MapViewer';
import { TimelineFeed } from './TimelineFeed';
import { ActionDock } from './ActionDock';
import { NPCDialogueModal } from './NPCDialogueModal';
import type { SceneDetail, SceneNPC, ScenePointOfInterest, SessionEvent } from '../../../types';
import './ActiveTable.css';

type Props = {
  sessionId: string;
  sessionName: string;
  scene: SceneDetail;
};

export function ActiveTable({ sessionId, sessionName, scene }: Props) {
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [activeNpc, setActiveNpc] = useState<SceneNPC | null>(null);
  // "Mover"/"Investigar" não têm endpoint de persistência dedicado hoje (os
  // 3 tipos client-submissíveis são adventure_started/npc_dialogue_choice/
  // dice_roll — ver be-rpg session/model.go) — exibimos apenas feedback
  // local em vez de inventar um cálculo de rolagem no frontend (proibido
  // pela Regra de Ouro em web-rpg/CLAUDE.md). Documentado como limitação.
  const [poiNotice, setPoiNotice] = useState<{ poi: ScenePointOfInterest; kind: 'move' | 'investigate' } | null>(
    null
  );

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
      />

      <TimelineFeed scene={scene} events={events} loading={eventsLoading} />

      <ActionDock
        scene={scene}
        hasActiveCombat={false}
        onSpeak={() => setActiveNpc(scene.npcs[0] ?? null)}
        onMove={() => setPoiNotice(scene.points_of_interest[0] ? { poi: scene.points_of_interest[0], kind: 'move' } : null)}
        onInvestigate={() =>
          setPoiNotice(scene.points_of_interest[0] ? { poi: scene.points_of_interest[0], kind: 'investigate' } : null)
        }
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

      {poiNotice && (
        <div className="activetable-poi-toast" role="status">
          <span>
            {poiNotice.kind === 'move'
              ? `Deslocando-se para ${poiNotice.poi.name}...`
              : `Investigando ${poiNotice.poi.name}...`}
          </span>
          <button type="button" onClick={() => setPoiNotice(null)} aria-label="Fechar aviso">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
