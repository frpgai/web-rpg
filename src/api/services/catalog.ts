import { apiClient } from '../client';
import type { Ancestry, Background, CharacterClass, AvatarPreset, PreviewResult } from '../../types';

export const catalogApi = {
  ancestries: () => apiClient.get('api/v1/ancestries').json<Ancestry[]>(),
  classes: () => apiClient.get('api/v1/classes').json<CharacterClass[]>(),
  backgrounds: () => apiClient.get('api/v1/backgrounds').json<Background[]>(),
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
};
