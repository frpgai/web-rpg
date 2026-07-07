import { useCallback, useEffect, useState } from 'react';
import { sessionApi } from '../../../api/services/session';
import { useSessionSocket } from '../../../hooks/useSessionSocket';
import { SessionHeader } from '../../../components/navigation/SessionHeader';
import { SessionBottomNav } from '../../../components/navigation/SessionBottomNav';
import { MapViewer } from './MapViewer';
import { TimelineFeed } from './TimelineFeed';
import { ActionDock } from './ActionDock';
import { NPCDialogueModal } from './NPCDialogueModal';
import { InvestigateModal } from './InvestigateModal';
import { POIDetailSheet } from './POIDetailSheet';
import type {
  PoiDiscoveredEventPayload,
  SceneDetail,
  SceneNPC,
  ScenePointOfInterest,
  SessionEvent,
  SessionSocketEvent,
} from '../../../types';
import './ActiveTable.css';

type Props = {
  sessionId: string;
  sessionName: string;
  scene: SceneDetail;
  onRefreshScene: () => Promise<void> | void;
};

// Mescla os POIs recém-revelados por um evento `session.poi_discovered` no
// estado local (spec 00153-mesa-jogo/investigacao.md seção 2.5): POIs que já
// estavam na lista (visible_initially=true, ainda não descobertos) têm o
// nome atualizado para o detalhado; POIs que não estavam (eram invisíveis)
// são inseridos, passando a renderizar no MapViewer.
function mergeDiscoveredPois(
  current: ScenePointOfInterest[],
  discovered: PoiDiscoveredEventPayload['pois']
): ScenePointOfInterest[] {
  const byId = new Map(current.map((poi) => [poi.id, poi]));
  for (const poi of discovered) {
    byId.set(poi.id, {
      id: poi.id,
      display_name: poi.display_name,
      description: poi.description,
      x_coordinate: poi.x_coordinate,
      y_coordinate: poi.y_coordinate,
      investigable: false,
    });
  }
  return Array.from(byId.values());
}

export function ActiveTable({ sessionId, sessionName, scene, onRefreshScene }: Props) {
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [activeNpc, setActiveNpc] = useState<SceneNPC | null>(null);
  const [investigateOpen, setInvestigateOpen] = useState(false);
  // POI pré-selecionado ao abrir "Investigar" a partir de um clique direto
  // num pin do mapa (spec 00153-mesa-jogo/investigacao.md seção 2.1) — pula
  // a bottom sheet de escolha e vai direto para a rolagem daquele POI.
  const [investigatePresetPoi, setInvestigatePresetPoi] = useState<ScenePointOfInterest | null>(null);
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
  // bottom sheet de detalhes (spec 00153-mesa-jogo/investigacao.md seção 2.2).
  const [selectedPoi, setSelectedPoi] = useState<ScenePointOfInterest | null>(null);

  // Cópia local dos POIs da cena, reconciliada com `scene.points_of_interest`
  // sempre que a cena é recarregada, e atualizada em tempo real pelo evento
  // WebSocket `session.poi_discovered` (seção 2.5 da spec) sem esperar um
  // refetch — inclusive para jogadores que não foram quem investigou.
  //
  // Reconciliação feita durante a renderização (padrão React "adjusting
  // state during render", não um useEffect) — evita o cascading render de
  // `setState` síncrono dentro de efeito: guarda o `scene.id` junto do
  // estado e, se ele mudou desde o último render, recalcula `pois` a partir
  // da nova cena antes de pintar a tela.
  const [poisState, setPoisState] = useState<{ sceneId: string; pois: ScenePointOfInterest[] }>(() => ({
    sceneId: scene.id,
    pois: scene.points_of_interest,
  }));
  if (poisState.sceneId !== scene.id) {
    setPoisState({ sceneId: scene.id, pois: scene.points_of_interest });
  }
  const pois = poisState.pois;

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

  const handleSocketEvent = useCallback(
    (event: SessionSocketEvent) => {
      if (event.type === 'session.poi_discovered') {
        const payload = event.payload as PoiDiscoveredEventPayload | undefined;
        if (payload?.pois?.length) {
          setPoisState((current) => ({ ...current, pois: mergeDiscoveredPois(current.pois, payload.pois) }));
          // Pulso luminoso dourado (~3s, ver MapViewer.css) no pin mais
          // recém-descoberto — mesmo tratamento visual de uma descoberta
          // local, mas disparado por qualquer jogador da sessão.
          setJustDiscoveredPoiId(payload.pois[payload.pois.length - 1].id);
        }
      }
      fetchEvents();
    },
    [fetchEvents]
  );

  useSessionSocket(sessionId, handleSocketEvent);

  const sceneForChildren: SceneDetail = { ...scene, points_of_interest: pois };

  return (
    <div className="activetable-root">
      <SessionHeader title={sessionName} />

      <div className="activetable-main">
        <MapViewer
          scene={sceneForChildren}
          justDiscoveredPoiId={justDiscoveredPoiId}
          onPoiClick={(poiId) => {
            const poi = pois.find((p) => p.id === poiId) ?? null;
            setSelectedPoi(poi);
          }}
        />

        <ActionDock
          scene={sceneForChildren}
          hasActiveCombat={false}
          onSpeak={() => setActiveNpc(scene.npcs[0] ?? null)}
          onMove={() => setPoiNotice(pois[0] ? { poi: pois[0], kind: 'move' } : null)}
          onInvestigate={() => {
            setInvestigatePresetPoi(null);
            setInvestigateOpen(true);
          }}
          onCombat={() => {}}
        />

        <TimelineFeed scene={sceneForChildren} events={events} loading={eventsLoading} />
      </div>

      <SessionBottomNav />

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
          scene={sceneForChildren}
          presetPoi={investigatePresetPoi}
          onClose={() => setInvestigateOpen(false)}
          onEventLogged={() => {
            fetchEvents();
            onRefreshScene();
          }}
          onDiscovered={(poiId) => setJustDiscoveredPoiId(poiId)}
        />
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
            setInvestigatePresetPoi(selectedPoi);
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
    </div>
  );
}
