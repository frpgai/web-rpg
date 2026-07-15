import { interactionApi } from '../../../../../api/services/interaction';
import { Spinner } from '../../../../../components/ui/Spinner';

import { SessionHeader } from '../../../../../components/navigation/SessionHeader';
import { MapViewer } from './MapViewer';
import { TimelineFeed } from './events/TimelineFeed';
import { EventImmersiveOverlay } from './events/EventImmersiveOverlay';
import { ActionDock } from './ActionDock';
import { NPCDialogueModal } from './NPCDialogueModal';
import { InvestigateModal } from './InvestigateModal';
import { POIDetailSheet } from './POIDetailSheet';
import type { SessionDetail } from '../../../../../types';
import { DiceRollOverlay } from '../../../../../components/dice/DiceRollOverlay';
import { useScenePhase } from './hooks/useScenePhase';
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
  const state = useScenePhase(sessionId, session);

  if (state.sceneLoading) {
    return (
      <div className="sceneplay-root sceneplay-loading">
        <Spinner color="var(--color-primary)" size="large" />
      </div>
    );
  }

  if (state.sceneError || !state.scene) {
    return (
      <div className="sceneplay-root sceneplay-loading">
        <p className="sceneplay-error">{state.sceneError ?? 'Nenhuma cena ativa nesta sessão.'}</p>
      </div>
    );
  }

  const { scene } = state;

  return (
    <div className="sceneplay-root">
      <SessionHeader title={session.name} />

      <MapViewer
        scene={scene}
        players={state.players}
        justDiscoveredPoiId={state.justDiscoveredPoiId}
        onPoiClick={(poiId) => {
          const poi = scene.points_of_interest.find((p) => p.id === poiId) ?? null;
          state.setSelectedPoi(poi);
          state.setPoiActions([]);
          if (poi) {
            interactionApi
              .getActions(sessionId, 'poi', poi.id)
              .then(state.setPoiActions)
              .catch((err) => console.error('Failed to load POI actions:', err));
          }
        }}
      />

      <TimelineFeed scene={scene} events={state.events} loading={state.eventsLoading} players={state.players} />

      <ActionDock
        scene={scene}
        hasActiveCombat={false}
        onSpeak={() => state.setActiveNpc(scene.npcs[0] ?? null)}
        onMove={() =>
          state.setPoiNotice(
            scene.points_of_interest[0] ? { poi: scene.points_of_interest[0], kind: 'move' } : null
          )
        }
        onInvestigate={() => state.setInvestigateOpen(true)}
        onCombat={() => {}}
      />

      {state.activeNpc && (
        <NPCDialogueModal
          sessionId={sessionId}
          sceneId={scene.id}
          npc={state.activeNpc}
          onClose={() => state.setActiveNpc(null)}
          onEventLogged={state.fetchEvents}
        />
      )}

      {state.investigateOpen && (
        <InvestigateModal
          sessionId={sessionId}
          scene={scene}
          presetPoi={state.investigatePresetPoi}
          onClose={() => {
            state.setInvestigateOpen(false);
            state.setInvestigatePresetPoi(null);
          }}
        />
      )}

      {state.selectedPoi && (
        <POIDetailSheet
          poi={state.selectedPoi}
          actions={state.poiActions}
          onClose={() => state.setSelectedPoi(null)}
          onMove={() => {
            state.handleMovePlayer(state.selectedPoi!);
            state.setSelectedPoi(null);
          }}
          onInvestigate={() => {
            state.setInvestigatePresetPoi(state.selectedPoi);
            state.setInvestigateOpen(true);
            state.setSelectedPoi(null);
          }}
          onOpen={() => {
            state.handleOpenPoi(state.selectedPoi!);
            state.setSelectedPoi(null);
          }}
          onGenericAction={(slug) => {
            state.handleGenericPoiAction(state.selectedPoi!, slug);
            state.setSelectedPoi(null);
          }}
        />
      )}

      <DiceRollOverlay />

      {state.immersiveEvent && (
        <EventImmersiveOverlay event={state.immersiveEvent} onClose={() => state.setImmersiveEvent(null)} />
      )}
    </div>
  );
}
