// SRD 5.2.1 Point-Buy constants
export const POINT_BUY_BUDGET = 27;

export const POINT_BUY_COST: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export function totalCost(attrs: Record<string, number>): number {
  return Object.values(attrs).reduce((sum, v) => sum + (POINT_BUY_COST[v] ?? 0), 0);
}
