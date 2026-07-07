import { apiClient } from '../client';
import type { CreateRollRequestInput, DiceRollResult } from '../../types/diceRoll';

export const diceRollApi = {
  createRollRequest: (sessionId: string, input: CreateRollRequestInput) =>
    apiClient
      .post(`api/v1/sessions/${sessionId}/roll-requests`, { json: input })
      .json<{ roll_request_id: string }>(),

  getRoll: (id: string) =>
    apiClient.get(`api/v1/rolls/${id}`).json<DiceRollResult>(),

  listRolls: (
    sessionId: string,
    filters?: { character_id?: string; roll_request_id?: string; limit?: number; offset?: number }
  ) => {
    const searchParams = new URLSearchParams();
    searchParams.set('session_id', sessionId);
    if (filters?.character_id) searchParams.set('character_id', filters.character_id);
    if (filters?.roll_request_id) searchParams.set('roll_request_id', filters.roll_request_id);
    if (filters?.limit) searchParams.set('limit', String(filters.limit));
    if (filters?.offset) searchParams.set('offset', String(filters.offset));

    return apiClient
      .get('api/v1/rolls', { searchParams })
      .json<{ data: DiceRollResult[]; total: number; limit: number; offset: number }>();
  },
};
