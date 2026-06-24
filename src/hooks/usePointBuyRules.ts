import { useEffect, useState } from 'react';
import { getPointBuyRules } from '../api/services/rules';

export interface PointBuyRules {
  budget: number;
  min: number;
  max: number;
  costTable: Record<number, number>;
}

const FALLBACK: PointBuyRules = {
  budget: 27,
  min: 8,
  max: 15,
  costTable: { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 },
};

export function usePointBuyRules() {
  const [rules, setRules] = useState<PointBuyRules>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPointBuyRules()
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
      .catch(() => setError('Não foi possível carregar as regras. Usando valores padrão.'))
      .finally(() => setLoading(false));
  }, []);

  return { rules, loading, error };
}
