import { useCallback, useEffect, useState } from 'react';
import { sessionApi } from '../../../api/services/session';
import { useSessionSocket } from '../../../hooks/useSessionSocket';
import { useAuthStore } from '../../../stores/authStore';
import { useInvestigatePoi } from './useInvestigatePoi';
import { MapViewer } from './MapViewer';
import { TimelineFeed } from './TimelineFeed';
import { ActionDock } from './ActionDock';
import { NPCDialogueModal } from './NPCDialogueModal';
import { Toast } from '../../../components/ui/Toast';
import type { SceneDetail, SceneNPC, ScenePointOfInterest, SessionEvent } from '../../../types';
import './ActiveTable.css';

type Props = {
  sessionId: string;
  sessionName: string;
  scene: SceneDetail;
  onSceneRefresh: () => Promise<void>;
};

export function ActiveTable({ sessionId, sessionName, scene, onSceneRefresh }: Props) {
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [activeNpc, setActiveNpc] = useState<SceneNPC | null>(null);
  // "Mover" ainda não tem endpoint de persistência dedicado (só
  // adventure_started/npc_dialogue_choice/dice_roll/poi_investigation são
  // client-submissíveis hoje — ver be-rpg session/model.go) — exibe só
  // feedback local. "Investigar" já usa o endpoint real (ver
  // useInvestigatePoi).
  const [poiNotice, setPoiNotice] = useState<{ poi: ScenePointOfInterest; kind: 'move' } | null>(null);
  const [discoveredPoiId, setDiscoveredPoiId] = useState<string | null>(null);
  const [localResultEvents, setLocalResultEvents] = useState<SessionEvent[]>([]);
  const [currentHeroId, setCurrentHeroId] = useState<string | null>(null);
  const { investigate, investigating, errorMessage, clearError } = useInvestigatePoi();
  const currentUserId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (!currentUserId) return;
    sessionApi
      .getPlayers(sessionId)
      .then((players) => {
        const me = players.find((p) => p.user_id === currentUserId);
        setCurrentHeroId(me?.hero?.id ?? null);
      })
      .catch((err) => console.error('Failed to load session players:', err));
  }, [sessionId, currentUserId]);

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

  const handleInvestigate = useCallback(async () => {
    const poi = scene.points_of_interest.find((p) => !p.enabled);
    if (!poi) return;
    if (!currentHeroId) return; // herói do jogador ainda não resolvido

    const response = await investigate(scene.id, poi.id, sessionId, currentHeroId);
    if (!response) return; // erro já exposto via errorMessage/toast

    const resultLabel = response.success ? 'Sucesso' : 'Falha';
    const text = response.success ? response.success_text : response.failure_text;
    setLocalResultEvents((prev) => [
      ...prev,
      {
        seq: Date.now(),
        session_id: sessionId,
        scene_id: scene.id,
        type: 'poi_investigation_result',
        payload: { text: `${resultLabel} (${response.total}) — ${text ?? ''}`.trim() },
        created_at: new Date().toISOString(),
      },
    ]);

    if (response.success) {
      setDiscoveredPoiId(response.poi_id);
      await onSceneRefresh();
      window.setTimeout(() => setDiscoveredPoiId(null), 3000);
    }
    fetchEvents();
  }, [scene, sessionId, currentHeroId, investigate, onSceneRefresh, fetchEvents]);

  return (
    <div className="activetable-root">
      <header className="activetable-header">
        <h1 className="activetable-header-title">{sessionName}</h1>
      </header>

      <MapViewer
        scene={scene}
        onSelectNpc={setActiveNpc}
        onSelectPoi={(poi) => setPoiNotice({ poi, kind: 'move' })}
        discoveredPoiId={discoveredPoiId}
      />

      <TimelineFeed scene={scene} events={[...events, ...localResultEvents]} loading={eventsLoading} />

      <ActionDock
        scene={scene}
        hasActiveCombat={false}
        onSpeak={() => setActiveNpc(scene.npcs[0] ?? null)}
        onMove={() => setPoiNotice(scene.points_of_interest[0] ? { poi: scene.points_of_interest[0], kind: 'move' } : null)}
        onInvestigate={handleInvestigate}
        onCombat={() => {}}
      />

      <Toast message={errorMessage} onDismiss={clearError} />
      {investigating && (
        <div className="activetable-poi-toast" role="status">
          <span>Investigando...</span>
        </div>
      )}

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
          <span>{`Deslocando-se para ${poiNotice.poi.name}...`}</span>
          <button type="button" onClick={() => setPoiNotice(null)} aria-label="Fechar aviso">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
