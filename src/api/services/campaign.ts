import { apiClient } from '../client';
import type { AvailableCampaign, CampaignListParams, CampaignListResponse } from '../../types';

function buildCampaignListSearchParams(params: CampaignListParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set('q', params.q);
  if (params.level_start !== undefined) searchParams.set('level_start', String(params.level_start));
  if (params.level_end !== undefined) searchParams.set('level_end', String(params.level_end));
  if (params.tag) params.tag.forEach((t) => searchParams.append('tag', t));
  if (params.cursor) searchParams.set('cursor', params.cursor);
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  return searchParams;
}

export const campaignApi = {
  listAvailable: () => apiClient.get('api/v1/campaigns/available').json<AvailableCampaign[]>(),
  list: (params: CampaignListParams = {}) =>
    apiClient
      .get('api/v1/campaigns', { searchParams: buildCampaignListSearchParams(params) })
      .json<CampaignListResponse>(),
};
