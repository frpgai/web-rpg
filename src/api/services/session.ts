import { apiClient } from '../client';
import type {
  Adventure,
  CreateEventRequest,
  SessionDetail,
  SessionEvent,
  SessionEventsPage,
  SessionPlayer,
  StartSessionResponse,
} from '../../types';

export const sessionApi = {
  get: (sessionId: string) => apiClient.get(`api/v1/sessions/${sessionId}`).json<SessionDetail>(),
  getPlayers: (sessionId: string) =>
    apiClient.get(`api/v1/sessions/${sessionId}/players`).json<SessionPlayer[]>(),
  start: (sessionId: string) =>
    apiClient.post(`api/v1/sessions/${sessionId}/start`).json<StartSessionResponse>(),
  getAdventure: (sessionId: string) =>
    apiClient.get(`api/v1/sessions/${sessionId}/adventure`).json<Adventure>(),
  createEvent: (sessionId: string, body: CreateEventRequest) =>
    apiClient.post(`api/v1/sessions/${sessionId}/events`, { json: body }).json<SessionEvent>(),
  // Paginação apenas para frente (cursor "after seq") — a API ainda não suporta
  // buscar eventos anteriores a um ponto arbitrário ("before"), então não é
  // possível carregar eventos mais antigos ancorados a partir do topo da lista
  // já carregada. Ver relatório final do agente frontend para detalhes.
  getEvents: (sessionId: string, cursor?: string, limit = 50) => {
    const searchParams = new URLSearchParams();
    if (cursor) searchParams.set('cursor', cursor);
    searchParams.set('limit', String(limit));
    return apiClient
      .get(`api/v1/sessions/${sessionId}/events`, { searchParams })
      .json<SessionEventsPage>();
  },
};
