import { apiClient } from '../client';
import type {
  InvestigateGeneralRequest,
  InvestigateGeneralResponse,
  InvestigatePoiRequest,
  InvestigatePoiResponse,
  SceneDetail,
} from '../../types';

export const sceneApi = {
  // be-rpg branch feature/scene-session-endpoint (PR #70) — ainda não
  // mergeada em main. Resolve a cena no contexto de uma sessão de jogo
  // específica, mesclando o estado de descoberta (POIs desbloqueados, nomes
  // de NPC revelados) daquela sessão. Substitui o antigo `get(sceneId)`
  // (GET /api/v1/scenes/{id}, não escopado por sessão).
  getForSession: (sessionId: string, sceneId: string) =>
    apiClient.get(`api/v1/sessions/${sessionId}/scenes/${sceneId}`).json<SceneDetail>(),
  // be-rpg branch feature/poi-investigation-system, internal/scene/handler.go
  // (Handler.InvestigatePOI): POST /api/v1/scenes/{scene_id}/pois/{poi_id}/investigate.
  // Confirma contrato: { session_id, hero_id, roll } — sem campo `skill`, o
  // POI tem um único skill_check resolvido inteiramente no backend.
  investigatePoi: (sceneId: string, poiId: string, body: InvestigatePoiRequest) =>
    apiClient
      .post(`api/v1/scenes/${sceneId}/pois/${poiId}/investigate`, { json: body })
      .json<InvestigatePoiResponse>(),
  // be-rpg branch feature/poi-investigation-system, internal/scene/handler.go
  // (Handler.InvestigateGeneral): POST /api/v1/scenes/{scene_id}/investigate-general
  // ("vasculhar o local") — aqui sim o jogador escolhe a perícia (`skill`),
  // pois o roll é verificado contra todo POI oculto configurado na cena, não
  // um único POI com skill_check fixo.
  investigateGeneral: (sceneId: string, body: InvestigateGeneralRequest) =>
    apiClient
      .post(`api/v1/scenes/${sceneId}/investigate-general`, { json: body })
      .json<InvestigateGeneralResponse>(),
};
