import { apiClient } from '../client';
import type { InvestigatePoiRequest, InvestigatePoiResponse, SceneDetail } from '../../types';

export const sceneApi = {
  // be-rpg branch feature/scene-session-endpoint (PR #70) — ainda não
  // mergeada em main. Resolve a cena no contexto de uma sessão de jogo
  // específica, mesclando o estado de descoberta (POIs desbloqueados, nomes
  // de NPC revelados) daquela sessão. Substitui o antigo `get(sceneId)`
  // (GET /api/v1/scenes/{id}, não escopado por sessão).
  getForSession: (sessionId: string, sceneId: string) =>
    apiClient.get(`api/v1/sessions/${sessionId}/scenes/${sceneId}`).json<SceneDetail>(),
  // be-rpg branch feature/poi-investigation (PR #68) — ainda não mergeada em
  // main. Contrato confirmado lendo internal/scene/handler.go/service.go
  // nessa branch: POST /api/v1/scenes/{scene_id}/pois/{poi_id}/investigate.
  investigatePoi: (sceneId: string, poiId: string, body: InvestigatePoiRequest) =>
    apiClient
      .post(`api/v1/scenes/${sceneId}/pois/${poiId}/investigate`, { json: body })
      .json<InvestigatePoiResponse>(),
};
