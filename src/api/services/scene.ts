import { apiClient } from '../client';
import type { SceneDetail } from '../../types';

export const sceneApi = {
  get: (sceneId: string) => apiClient.get(`api/v1/scenes/${sceneId}`).json<SceneDetail>(),
};
