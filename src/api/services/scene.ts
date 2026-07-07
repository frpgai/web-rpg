import { apiClient } from '../client';
import type { SceneDetail } from '../../types';

export const sceneApi = {
  // be-rpg branch feature/scene-session-endpoint (PR #70). Resolve a cena no
  // contexto de uma sessão de jogo específica, mesclando o estado de
  // descoberta (POIs desbloqueados, nomes de NPC revelados) daquela sessão.
  // Substitui o antigo `get(sceneId)` (GET /api/v1/scenes/{id}, não escopado
  // por sessão).
  getForSession: (sessionId: string, sceneId: string) =>
    apiClient.get(`api/v1/sessions/${sessionId}/scenes/${sceneId}`).json<SceneDetail>(),
  // Nota: os antigos endpoints dedicados de investigação
  // (`POST .../pois/{poi_id}/investigate` e `.../investigate-general`) foram
  // removidos (be-rpg commits e123710/f0eafa5). A investigação agora usa o
  // fluxo genérico de `roll-requests` — ver `diceRollApi.createRollRequest`
  // em `api/services/diceRoll.ts` e `useInvestigate.ts`.
};
