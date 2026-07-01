import { apiClient } from '../../../api/client';
import type { CreateSessionRequest, Session } from '../../../types';

export const sessionApi = {
  create: (data: CreateSessionRequest) =>
    apiClient.post('api/v1/sessions', { json: data }).json<Session>(),
};
