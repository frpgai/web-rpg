import { apiClient } from '../client';
import type { NPCDialogueTree } from '../../types';

export const npcApi = {
  // {id} aqui é o id do campaign_npc retornado em scene.npcs[].id, não um id
  // de catálogo genérico — ver spec A00153 seção 5.
  getDialogueTree: (campaignNpcId: string) =>
    apiClient.get(`api/v1/npcs/${campaignNpcId}/dialogue-tree`).json<NPCDialogueTree>(),
};
