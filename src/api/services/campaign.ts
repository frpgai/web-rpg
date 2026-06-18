import { apiClient } from '../client';
import type { AvailableCampaign } from '../../types';

export const campaignApi = {
  listAvailable: () => apiClient.get('api/v1/campaigns/available').json<AvailableCampaign[]>(),
};
