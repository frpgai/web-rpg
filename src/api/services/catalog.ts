import { apiClient } from '../client';
import type { Ancestry, AncestryDetails, Background, BackgroundDetails, CharacterClass, AvatarPreset, PreviewResult, Vocation, VocationDetails } from '../../types';

export const catalogApi = {
  ancestries: () => apiClient.get('api/v1/ancestries').json<Ancestry[]>(),
  ancestryDetails: (id: string) => apiClient.get(`api/v1/ancestries/${id}`).json<AncestryDetails>(),
  classes: () => apiClient.get('api/v1/classes').json<CharacterClass[]>(),
  backgrounds: () => apiClient.get('api/v1/backgrounds').json<Background[]>(),
  backgroundDetails: (id: string) => apiClient.get(`api/v1/backgrounds/${id}`).json<BackgroundDetails>(),
  vocations: (systemId: string) => apiClient.get(`api/v1/vocations/system/${systemId}`).json<Vocation[]>(),
  vocationDetails: (id: string) => apiClient.get(`api/v1/vocations/${id}`).json<VocationDetails>(),
  avatars: (ancestry: string, classSlug: string) =>
    apiClient.get(`api/v1/avatars?ancestry=${ancestry}&characterClass=${classSlug}`).json<AvatarPreset[]>(),
  fetchAvatars: (ancestryId: string, classId: string, backgroundId?: string) => {
    const params = new URLSearchParams({
      ancestry_id: ancestryId,
      characterClass_id: classId,
    });
    if (backgroundId) params.append('background_id', backgroundId);
    return apiClient.get(`api/v1/avatars?${params.toString()}`).json<AvatarPreset[]>();
  },
  previewHero: (input: {
    ancestry_id: string | null;
    characterClass_id: string | null;
    background_id: string | null;
  }) => apiClient.post('api/v1/hero/preview', { json: input }).json<PreviewResult>(),
  previewHeroV2: (input: {
    ancestry_id: string | null;
    class_id: string | null;
    background_id: string | null;
  }) => apiClient.post('api/v1/hero/preview', { json: input }).json<PreviewResult>(),
};
