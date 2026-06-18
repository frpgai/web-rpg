import { apiClient } from '../client';
import type { PendingTurn } from '../../types';

export const turnApi = {
  pending: () => apiClient.get('api/v1/turns/pending').json<PendingTurn>(),
};
