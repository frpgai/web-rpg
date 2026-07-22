import type { SystemAttribute } from '../../../../../api/services/attributes';
import type { BackgroundDetails, HeroAttributes } from '../../../../../types';
import type { PointBuyRules } from '../type';

interface UseAttributeOracleParams {
  rules: PointBuyRules | null;
  systemAttributes: SystemAttribute[];
  backgroundDetails: BackgroundDetails | null;
  eligibleAttributes: string[];
  setAttrs: (attrs: HeroAttributes) => void;
  setAllocatedBonuses: (bonuses: Record<string, number>) => void;
}

// Random valid point-buy allocation within budget — attribute *allocation*,
// not a derived game stat, so this stays on the frontend. Only used by the
// oracle below, so it lives here rather than in the shared utils file.
function rollRandomAttributes(rules: PointBuyRules, keys: string[]): HeroAttributes {
  const MAX_RETRIES = 100;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const attrs: HeroAttributes = Object.fromEntries(keys.map((k) => [k, rules.min]));
    let remaining = rules.budget;
    const shuffled = [...keys].sort(() => Math.random() - 0.5);

    let valid = true;
    for (let i = 0; i < shuffled.length; i++) {
      const key = shuffled[i];
      const isLast = i === shuffled.length - 1;

      if (isLast) {
        const target = Object.entries(rules.costTable).find(([, cost]) => cost === remaining);
        if (!target) { valid = false; break; }
        attrs[key] = Number(target[0]);
        remaining = 0;
      } else {
        const affordable = Object.entries(rules.costTable)
          .filter(([v, cost]) => Number(v) >= rules.min && cost <= remaining)
          .map(([v]) => Number(v));
        if (affordable.length === 0) { valid = false; break; }
        const pick = affordable[Math.floor(Math.random() * affordable.length)];
        attrs[key] = pick;
        remaining -= rules.costTable[pick];
      }
    }

    if (valid && remaining === 0) return attrs;
  }

  // Fallback: all attributes at min
  return Object.fromEntries(keys.map((k) => [k, rules.min]));
}

// Everything the "Oracle" (auto-distribute) button needs to do its job:
// roll a random valid point-buy allocation, then auto-assign the
// background's ASI bonuses across the eligible attributes. Isolated from
// the rest of the step's state/fetch logic — it only reads what's passed
// in and writes back through the two setters, nothing else.
export function useAttributeOracle({
  rules,
  systemAttributes,
  backgroundDetails,
  eligibleAttributes,
  setAttrs,
  setAllocatedBonuses,
}: UseAttributeOracleParams) {
  function rollAttributes() {
    if (!rules) return;
    setAttrs(rollRandomAttributes(rules, systemAttributes.map((a) => a.slug)));

    if (backgroundDetails && eligibleAttributes.length > 0) {
      const eligibleSlugs = systemAttributes
        .filter((a) => eligibleAttributes.includes(a.id))
        .map((a) => a.slug);

      const bonuses = [...(backgroundDetails.bonuses ?? [])].sort((a, b) => b - a);
      const newBonuses: Record<string, number> = {};

      if (eligibleSlugs.length > 0) {
        const shuffled = [...eligibleSlugs].sort(() => Math.random() - 0.5);
        bonuses.forEach((bonusVal, idx) => {
          const targetSlug = shuffled[idx % shuffled.length];
          newBonuses[targetSlug] = (newBonuses[targetSlug] ?? 0) + bonusVal;
        });
      }
      setAllocatedBonuses(newBonuses);
    }
  }

  return { rollAttributes };
}
