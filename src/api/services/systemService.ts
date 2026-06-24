import { apiClient } from '../client';
import type { System, SystemRules, SystemAttribute } from '../../types';

export const systemService = {
  list: () => apiClient.get('api/v1/systems').json<System[]>(),
  getRules: () => apiClient.get('api/v1/rules').json<SystemRules>(),
  getAttributes: () => apiClient.get('api/v1/attributes').json<SystemAttribute[]>(),
};
