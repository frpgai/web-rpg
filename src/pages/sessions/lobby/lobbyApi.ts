import { apiClient } from '../../../api/client';
import type { SessionDetail, SessionPlayer, StartSessionResponse } from '../../../types';

export const lobbyApi = {
  get: (sessionId: string) =>
    apiClient.get(`api/v1/sessions/${sessionId}`).json<SessionDetail>(),
  getPlayers: (sessionId: string) =>
    apiClient.get(`api/v1/sessions/${sessionId}/players`).json<SessionPlayer[]>(),
  start: (sessionId: string) =>
    apiClient.post(`api/v1/sessions/${sessionId}/start`).json<StartSessionResponse>(),
};
