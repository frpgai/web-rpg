// Point-buy rules (system_rules) — only used on this page/flow, kept local.
// Shared across the step hook, the grid, the help card and the oracle hook,
// so it stays here rather than inside any single one of them.
export interface PointBuyRules {
  budget: number;
  min: number;
  max: number;
  costTable: Record<number, number>;
}
