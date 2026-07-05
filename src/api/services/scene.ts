import { apiClient } from '../client';
import type { InvestigatePoiRequest, InvestigatePoiResponse, SceneDetail } from '../../types';

export const sceneApi = {
  get: (sceneId: string) => apiClient.get(`api/v1/scenes/${sceneId}`).json<SceneDetail>(),
  investigatePoi: (sceneId: string, poiId: string, body: InvestigatePoiRequest) =>
    apiClient
      .post(`api/v1/scenes/${sceneId}/pois/${poiId}/investigate`, { json: body })
      .json<InvestigatePoiResponse>(),
};
