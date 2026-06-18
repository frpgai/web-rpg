import { apiClient } from '../client';
import type { System } from '../../types';

export const systemService = {
  list: () => apiClient.get('api/v1/systems').json<System[]>(),
};
