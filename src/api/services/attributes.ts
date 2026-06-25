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

export async function getSystemAttributes(): Promise<SystemAttribute[]> {
  return apiClient.get('api/v1/attributes').json<SystemAttribute[]>();
}

export async function previewAttributes(params: {
  backgroundId?: string;
  [slug: string]: number | string | undefined;
}): Promise<AttributePreviewResult> {
  const searchParams: Record<string, string | number> = {};
  for (const [key, val] of Object.entries(params)) {
    if (key === 'backgroundId') continue;
    if (typeof val === 'number') searchParams[key] = val;
  }
  if (params.backgroundId) searchParams.background_id = params.backgroundId as string;
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
