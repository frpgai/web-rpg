import { apiClient } from '../client';
import type {
  Adventure,
  CreateEventRequest,
  PlayerPhase,
  SessionDetail,
  SessionEvent,
  SessionEventsPage,
  SessionPlayer,
  StartSessionResponse,
} from '../../types';

// Código de erro retornado no corpo (`{ code, message }`) da resposta 422 de
// `POST /sessions/:id/next-phase` quando o Host ainda não destrancou uma
// próxima fase globalmente — be-rpg `internal/session/handler.go`, `NextPhase`.
export const NEXT_PHASE_NO_NEXT_PHASE_CODE = 'NO_NEXT_PHASE';

export const sessionApi = {
  get: (sessionId: string) => apiClient.get(`api/v1/sessions/${sessionId}`).json<SessionDetail>(),
  getPlayers: (sessionId: string) =>
    apiClient.get(`api/v1/sessions/${sessionId}/players`).json<SessionPlayer[]>(),
  start: (sessionId: string) =>
    apiClient.post(`api/v1/sessions/${sessionId}/start`).json<StartSessionResponse>(),
  // Marca a fase atual do jogador como revelada e retorna a próxima fase já
  // destrancada globalmente pelo Host. Responde 422 (`NO_NEXT_PHASE`) quando
  // não há próxima fase destrancada ainda — ver `NEXT_PHASE_NO_NEXT_PHASE_CODE`.
  nextPhase: (sessionId: string) =>
    apiClient.post(`api/v1/sessions/${sessionId}/next-phase`).json<PlayerPhase>(),
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
