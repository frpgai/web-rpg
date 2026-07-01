import { apiClient } from '../../../api/client';
import type { SessionDetail, StartSessionResponse } from '../../../types';

export const lobbyApi = {
  get: (sessionId: string) =>
    apiClient.get(`api/v1/sessions/${sessionId}`).json<SessionDetail>(),
  start: (sessionId: string) =>
    apiClient.post(`api/v1/sessions/${sessionId}/start`).json<StartSessionResponse>(),
};
