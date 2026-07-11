import { useEffect, useState } from 'react';
import { sessionApi } from '../../../../../api/services/session';
import { useAuthStore } from '../../../../../stores/authStore';
import { useDiceRollStore } from '../../../../../stores/diceRollStore';
import { interactionApi } from '../../../../../api/services/interaction';
import type { SceneDetail, ScenePointOfInterest } from '../../../../../types';
import { isPoiInvestigable } from '../../../../../types';

/**
 * Fluxo de Investigação (spec 00153-mesa-jogo/investigacao.md, seções 2.3 e
 * 4.1): não há mais rolagem fake no cliente nem endpoints dedicados
 * (`/investigate`, `/investigate-general` foram removidos em be-rpg
 * commits e123710/f0eafa5). Toda investigação — direcionada ou geral — passa
 * pelo fluxo genérico de `interactions` (spec 00134-rolagem-dados), o mesmo
 * usado por combate/diálogo: este hook apenas dispara
 * `triggerRollRequest` com o `action` e `target_type` corretos e deixa
 * o dado 3D (`DiceRollOverlay`, já montado em `ActiveTable.tsx`) animar o
 * resultado real que chega via WebSocket `roll_resolved`.
 *
 * A descoberta em si (`session.poi_discovered` — revelar pins ocultos,
 * atualizar nome/descrição, pulso dourado, timeline) é tratada de forma
 * genérica no `useSessionSocket` de `ActiveTable.tsx`, que já recarrega a
 * cena e a timeline para qualquer POI descoberto — não duplicado aqui.
 *
 * Dois fluxos, mesmo endpoint (`POST /sessions/{id}/interactions`):
 * - "Investigar algo específico" (`investigate`): `target_type: 'poi'`, `target_id: poi.id`, `action: 'investigate'`.
 * - "Vasculhar o local" (`investigateGeneral`): `target_type: 'scene'`, `target_id: scene.id`, `action: 'search'`.
 */
export function useInvestigate(sessionId: string, scene: SceneDetail) {
  const authUserId = useAuthStore((s) => s.user?.id);
  const [heroId, setHeroId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const triggerRollRequest = useDiceRollStore((s) => s.triggerRollRequest);

  // Herói ativo do jogador atual: não há noção de "herói selecionado" na
  // tela de jogo hoje (ver limitação documentada em ActiveTable.tsx). Segue
  // o mesmo padrão de `sessionApi.getPlayers` usado em `usePlaySession`/
  // `CampaignIntro`, casando `session_player.user_id` com o usuário
  // autenticado (`useAuthStore`); se não encontrar (ex: `authStore.user`
  // ainda não carregado), cai para o primeiro herói disponível na sessão.
  useEffect(() => {
    sessionApi
      .getPlayers(sessionId)
      .then((players) => {
        const mine = players.find((p) => p.user_id === authUserId)?.hero ?? players.find((p) => p.hero)?.hero;
        setHeroId(mine?.id ?? null);
      })
      .catch((err) => console.error('Failed to load session players for investigate flow:', err));
  }, [sessionId, authUserId]);

  // be-rpg PR #80: `investigable` deu lugar à lista dinâmica `poi.actions` —
  // ver `isPoiInvestigable` em `types/index.ts`.
  const eligiblePois: ScenePointOfInterest[] = scene.points_of_interest.filter(isPoiInvestigable);
  const [sceneActions, setSceneActions] = useState<any[]>([]);

  useEffect(() => {
    interactionApi.getActions(sessionId, 'scene', scene.id)
      .then(setSceneActions)
      .catch((err) => console.error('Failed to load scene actions:', err));
  }, [sessionId, scene.id]);

  function investigate(poi: ScenePointOfInterest) {
    if (!heroId) {
      setError('Nenhum herói disponível para investigar.');
      return;
    }
    setError(null);
    triggerRollRequest(
      sessionId,
      {
        target_type: 'poi',
        target_id: poi.id,
        action: 'investigate',
        roll_type: 'normal',
      } as any,
      `Investigar: ${poi.display_name}`
    );
  }

  function investigateGeneral() {
    if (!heroId) {
      setError('Nenhum herói disponível para investigar.');
      return;
    }
    setError(null);
    triggerRollRequest(
      sessionId,
      {
        target_type: 'scene',
        target_id: scene.id,
        action: 'search',
        roll_type: 'normal',
      } as any,
      'Vasculhar o Local'
    );
  }

  return {
    eligiblePois,
    heroId,
    sceneActions,
    error,
    investigate,
    investigateGeneral,
  };
}
