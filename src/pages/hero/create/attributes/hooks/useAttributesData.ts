import { useCallback, useEffect, useState } from 'react';
import { getSystemRules } from '../../../../../api/services/rules';
import { getSystemAttributes, saveDraftAttributes } from '../../../../../api/services/attributes';
import type { SystemAttribute } from '../../../../../api/services/attributes';
import { heroApi } from '../../../../../api/services/hero';
import { catalogApi } from '../../../../../api/services/catalog';
import type { AncestryDetails, BackgroundDetails, HeroDetail, VocationDetails } from '../../../../../types';
import type { PointBuyRules } from '../type';

// All API calls for the attributes step (catalog/rules fetch, hero draft
// load, attributes save) — no allocation state. Only used by AttributesPage;
// composed alongside useAttributeAllocation / useAttributeOracle, not called
// by them.
export function useAttributesData(heroId: string | null) {
  const [systemAttributes, setSystemAttributes] = useState<SystemAttribute[]>([]);
  const [rules, setRules] = useState<PointBuyRules | null>(null);

  useEffect(() => {
    getSystemAttributes()
      .then((a) => setSystemAttributes(a))
      .catch((err: unknown) => {
        console.error('useAttributesApi: getSystemAttributes failed', err);
      });
    getSystemRules()
      .then((data) => {
        const costTable: Record<number, number> = {};
        for (const [k, v] of Object.entries(data.point_buy_costs)) {
          costTable[Number(k)] = v;
        }
        setRules({
          budget: data.point_buy_budget,
          min: data.min_attribute_score,
          max: data.max_attribute_buy_score,
          costTable,
        });
      })
      .catch((err: unknown) => {
        console.error('useAttributesApi: getSystemRules failed', err);
      });
  }, []);

  const [hero, setHero] = useState<HeroDetail | null>(null);
  useEffect(() => {
    if (!heroId) return;

    const id = heroId;
    let cancelled = false;

    async function init() {
      const data = await heroApi.get(id, 'draft');
      if (cancelled) return;
      setHero(data);
    }

    init();
    return () => { cancelled = true; };
  }, [heroId]);

  // Ancestry/vocation/background each come from their own catalog call
  // (hero.*_id → GET /ancestries|vocations|backgrounds/{id}), fired
  // independently as soon as hero loads — no Promise.all bundling, each
  // resolves on its own and re-renders whatever depends on it.
  const [ancestryDetails, setAncestryDetails] = useState<AncestryDetails | null>(null);
  const [vocationDetails, setVocationDetails] = useState<VocationDetails | null>(null);
  const [backgroundDetails, setBackgroundDetails] = useState<BackgroundDetails | null>(null);
  useEffect(() => {
    if (!hero) return;
    catalogApi.ancestryDetails(hero.ancestry_id).then(setAncestryDetails);
    catalogApi.vocationDetails(hero.vocation_id).then(setVocationDetails);
    catalogApi.backgroundDetails(hero.background_id).then(setBackgroundDetails);
  }, [hero]);

  const saveDraft = useCallback(
    (heroId: string, attributes: Array<{ attribute_id: string; value: number; bonus: number }>) => {
      return saveDraftAttributes(heroId, attributes);
    },
    [],
  );

  return {
    hero,
    rules,
    systemAttributes,
    ancestryDetails,
    vocationDetails,
    backgroundDetails,
    saveDraft,
  };
}
