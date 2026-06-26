import { apiClient } from '../client';
import type { Ancestry, AncestryDetails, Background, BackgroundDetails, CharacterClass, AvatarPreset, Vocation, VocationDetails, ClassKit, ClassAbility } from '../../types';

export const catalogApi = {
  ancestries: () => apiClient.get('api/v1/ancestries').json<Ancestry[]>(),
  ancestryDetails: (id: string) => apiClient.get(`api/v1/ancestries/${id}`).json<AncestryDetails>(),
  classes: () => apiClient.get('api/v1/classes').json<CharacterClass[]>(),
  backgrounds: () => apiClient.get('api/v1/backgrounds').json<Background[]>(),
  backgroundDetails: (id: string) => apiClient.get(`api/v1/backgrounds/${id}`).json<BackgroundDetails>(),
  vocations: () => apiClient.get('api/v1/vocations').json<Vocation[]>(),
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
  vocationStartingKits: (vocationId: string) =>
    apiClient.get(`api/v1/vocations/${vocationId}/starting-kits`).json<ClassKit[]>(),
  vocationAbilities: (vocationId: string) =>
    apiClient.get(`api/v1/vocations/${vocationId}/abilities`).json<ClassAbility[]>(),
};
