import { apiClient } from '../client';

export interface PointBuyRulesResponse {
  id: string;
  system_id: string;
  point_buy_budget: number;
  min_attribute_score: number;
  max_attribute_buy_score: number;
  point_buy_costs: Record<string, number>;
}

export async function getPointBuyRules(): Promise<PointBuyRulesResponse> {
  return apiClient.get('api/v1/rules').json<PointBuyRulesResponse>();
}
