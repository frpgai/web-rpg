import { apiClient } from '../client';

export interface SystemAttribute {
  id: string;
  slug: string;
  name: string;
  abbreviation: string;
  description: string;
  sort_order: number;
}

export interface AttributePreviewResult {
  points_spent: number;
  points_remaining: number;
  attributes: Record<string, {
    base: number;
    bonus: number;
    final: number;
    modifier: number;
  }>;
}

export async function getSystemAttributes(systemId: string): Promise<SystemAttribute[]> {
  return apiClient.get('api/v1/attributes', {
    searchParams: { system_id: systemId }
  }).json<SystemAttribute[]>();
}

export async function previewAttributes(params: {
  backgroundId?: string;
  str: number; dex: number; con: number; int: number; wis: number; cha: number;
}): Promise<AttributePreviewResult> {
  const searchParams: Record<string, string | number> = {
    str: params.str, dex: params.dex, con: params.con,
    int: params.int, wis: params.wis, cha: params.cha,
  };
  if (params.backgroundId) searchParams.background_id = params.backgroundId;
  return apiClient.get('api/v1/heroes/preview/attributes', { searchParams }).json<AttributePreviewResult>();
}

export async function saveDraftAttributes(heroId: string, attributes: Array<{
  attribute_id: string;
  value: number;
  bonus: number;
}>): Promise<{ id: string; draft_step: string }> {
  return apiClient.put(`api/v1/heroes/drafts/${heroId}/attributes`, {
    json: { attributes }
  }).json();
}
