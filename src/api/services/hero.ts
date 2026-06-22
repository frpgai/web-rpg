import { apiClient } from '../client';
import type { Hero, HeroDetail, CreateHeroRequest, PreviewResult, DraftHero, SaveDraftRequest, SaveDraftResponse } from '../../types';

export const heroApi = {
  list: () => apiClient.get('api/v1/heroes').json<Hero[]>(),
  create: (data: CreateHeroRequest) =>
    apiClient.post('api/v1/heroes', { json: data }).json<HeroDetail>(),
  get: (id: string) => apiClient.get(`api/v1/heroes/${id}`).json<HeroDetail>(),
  preview: (input: {
    ancestry_id: string | null;
    vocation_id: string | null;
    background_id: string | null;
  }) => {
    const params = new URLSearchParams();
    if (input.ancestry_id)   params.set('ancestry_id',   input.ancestry_id);
    if (input.vocation_id)   params.set('vocation_id',   input.vocation_id);
    if (input.background_id) params.set('background_id', input.background_id);
    const qs = params.toString();
    return apiClient.get(`api/v1/heroes/preview${qs ? '?' + qs : ''}`).json<PreviewResult>();
  },

  getDraft: (): Promise<DraftHero | null> =>
    apiClient.get('api/v1/heroes/draft').json<DraftHero>().catch((err: { response?: { status?: number } }) => {
      if (err?.response?.status === 404) return null;
      throw err;
    }),

  saveDraft: (data: SaveDraftRequest): Promise<SaveDraftResponse> =>
    apiClient.post('api/v1/heroes/draft', { json: data }).json<SaveDraftResponse>(),

  deleteDraft: (): Promise<void> =>
    apiClient.delete('api/v1/heroes/draft').then(() => undefined),
};
