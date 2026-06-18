import { apiClient } from '../client';
import type { Hero, HeroDetail, CreateHeroRequest } from '../../types';

export const heroApi = {
  list: () => apiClient.get('api/v1/heroes').json<Hero[]>(),
  create: (data: CreateHeroRequest) =>
    apiClient.post('api/v1/heroes', { json: data }).json<HeroDetail>(),
  get: (id: string) => apiClient.get(`api/v1/heroes/${id}`).json<HeroDetail>(),
};
