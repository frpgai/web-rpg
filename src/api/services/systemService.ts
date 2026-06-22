import { apiClient } from '../client';
import type { System, SystemRules, SystemAttribute } from '../../types';

export const systemService = {
  list: () => apiClient.get('api/v1/systems').json<System[]>(),
  getRules: (systemId: string) => apiClient.get(`api/v1/rules?system_id=${systemId}`).json<SystemRules>(),
  getAttributes: (systemId: string) => apiClient.get(`api/v1/attributes?system_id=${systemId}`).json<SystemAttribute[]>(),
};
