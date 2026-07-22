import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import type { SystemAttribute } from '../../../../../api/services/attributes';
import type { BackgroundDetails, HeroAttributes } from '../../../../../types';
import type { PointBuyRules } from '../type';

interface UseAttributeAllocationParams {
  rules: PointBuyRules | null;
  systemAttributes: SystemAttribute[];
  backgroundDetails: BackgroundDetails | null;
}

// Owns the attribute-allocation state (attrs, ASI bonuses) and every
// increment/decrement/back rule around it. Takes fetched data
// (rules/systemAttributes/backgroundDetails) from useAttributesApi as
// input. Doesn't call the API at all — saving and navigating to the next
// step is AttributesPage's job, since that's where the API call happens.
export function useAttributeAllocation({
  rules,
  systemAttributes,
  backgroundDetails,
}: UseAttributeAllocationParams) {
  const [, setLocation] = useLocation();

  const [showConfirm, setShowConfirm] = useState(false);

  // Starts null — seeded from rules.min (system_rules) once that loads,
  // never a hardcoded guess.
  const [attrs, setAttrs] = useState<HeroAttributes | null>(null);
  const [allocatedBonuses, setAllocatedBonuses] = useState<Record<string, number>>({});
  const asiAllPlus1 = false;

  // Seed attrs at rules.min once both rules and the system's attribute list
  // (str/dex/con/... today, but driven entirely by systemAttributes — never
  // a fixed set) are loaded.
  useEffect(() => {
    if (!rules || attrs || systemAttributes.length === 0) return;
    setAttrs(Object.fromEntries(systemAttributes.map((a) => [a.slug, rules.min])));
  }, [rules, attrs, systemAttributes]);

  function totalCost(a: Record<string, number>, costTable: Record<number, number>): number {
    return Object.values(a).reduce((sum, v) => sum + (costTable[v] ?? 0), 0);
  }

  const spent = useMemo(() => {
    if (!attrs || !rules) return 0;
    return totalCost(attrs, rules.costTable);
  }, [attrs, rules]);
  const remaining = rules ? rules.budget - spent : 0;
  const canNext = !!rules && spent === rules.budget;

  const eligibleAttributes = backgroundDetails ? backgroundDetails.eligible_attributes : [];

  const asiPoolTotal = useMemo(() => {
    if (!backgroundDetails) return 0;
    if (asiAllPlus1) return eligibleAttributes.length;
    return (backgroundDetails.bonuses ?? []).reduce((sum: number, v: number) => sum + v, 0);
  }, [backgroundDetails, asiAllPlus1, eligibleAttributes.length]);

  const asiMaxPerAttr = asiAllPlus1 ? 1 : 2;

  const attributeBonuses = useMemo<Partial<Record<string, number>>>(() => {
    const bonuses: Partial<Record<string, number>> = {};
    if (asiAllPlus1 && backgroundDetails) {
      for (const attrId of (backgroundDetails.eligible_attributes ?? [])) {
        const slug = systemAttributes.find((a) => a.id === attrId)?.slug;
        if (slug) {
          bonuses[slug] = 1;
        }
      }
    } else {
      for (const [k, v] of Object.entries(allocatedBonuses)) {
        bonuses[k] = v;
      }
    }
    return bonuses;
  }, [allocatedBonuses, asiAllPlus1, backgroundDetails, systemAttributes]);

  const asiAllocated = useMemo(() => {
    return eligibleAttributes.reduce((sum: number, attrId: string) => {
      const slug = systemAttributes.find((a) => a.id === attrId)?.slug;
      if (!slug) return sum;
      return sum + (attributeBonuses[slug as keyof typeof attributeBonuses] ?? 0);
    }, 0);
  }, [eligibleAttributes, attributeBonuses, systemAttributes]);
  const asiPoolRemaining = asiPoolTotal - asiAllocated;

  const bonusDescription = useMemo(() => {
    if (!backgroundDetails) return undefined;
    if (asiAllPlus1) return '+1 / +1 / +1';
    const formatted = (backgroundDetails.bonuses ?? [])
      .map((b: number) => `+${b}`)
      .join(' / ');
    return formatted || undefined;
  }, [backgroundDetails, asiAllPlus1]);

  function handleSetAttr(key: string, val: number) {
    if (!backgroundDetails || !attrs || !rules) return;
    const currentVal = attrs[key];
    const isIncrement = val > currentVal;

    const attrId = systemAttributes.find((a) => a.slug === key)?.id;
    const isEligible = attrId ? eligibleAttributes.includes(attrId) : false;

    if (isIncrement) {
      if (val > rules.max) return;

      if (isEligible) {
        const currentBonus = allocatedBonuses[key] ?? 0;
        const numAllocatedAttrs = Object.keys(allocatedBonuses).length;
        const maxAllocatedBonus = Object.values(allocatedBonuses).reduce((m, v) => Math.max(m, v), 0);

        let canAllocate = false;
        if (currentBonus < 2 && asiAllocated < 3) {
          if (currentBonus > 0) {
            if (asiAllocated + 1 <= 3) {
              canAllocate = true;
            }
          } else {
            if (numAllocatedAttrs < 2) {
              canAllocate = true;
            } else if (numAllocatedAttrs === 2 && maxAllocatedBonus <= 1) {
              canAllocate = true;
            }
          }
        }

        if (canAllocate) {
          setAllocatedBonuses((prev) => ({
            ...prev,
            [key]: currentBonus + 1,
          }));
          return;
        }
      }

      const diff = (rules.costTable[val] ?? 0) - (rules.costTable[currentVal] ?? 0);
      if (spent + diff > rules.budget) return;
      setAttrs((prev) => ({ ...prev, [key]: val }));
    } else {
      const currentBonus = allocatedBonuses[key] ?? 0;
      if (currentVal === rules.min && currentBonus === 0) return;

      if (currentVal > rules.min) {
        setAttrs((prev) => ({ ...prev, [key]: val }));
      } else {
        if (currentBonus > 0) {
          setAllocatedBonuses((prev) => {
            const next = { ...prev };
            if (currentBonus > 1) {
              next[key] = currentBonus - 1;
            } else {
              delete next[key];
            }
            return next;
          });
        }
      }
    }
  }

  function handleBack() {
    const hasChanges = spent > 0 || Object.keys(allocatedBonuses).length > 0;
    if (hasChanges) {
      setShowConfirm(true);
      return;
    }
    setLocation('/app/hero/create/origins');
  }

  function handleConfirmBack() {
    setShowConfirm(false);
    setLocation('/app/hero/create/origins');
  }

  return {
    attrs,
    setAttrs,
    setAllocatedBonuses,
    showConfirm,
    setShowConfirm,
    remaining,
    canNext,
    eligibleAttributes,
    asiPoolRemaining,
    asiMaxPerAttr,
    attributeBonuses,
    bonusDescription,
    handleSetAttr,
    handleBack,
    handleConfirmBack,
  };
}
