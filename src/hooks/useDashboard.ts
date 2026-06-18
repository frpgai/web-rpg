import { useCallback, useEffect, useState } from 'react';
import { heroApi } from '../api/services/hero';
import { turnApi } from '../api/services/turn';
import { campaignApi } from '../api/services/campaign';
import type { Hero, PendingTurn, AvailableCampaign } from '../types';

type DashboardState = {
  heroes: Hero[];
  pendingTurn: PendingTurn | null;
  campaigns: AvailableCampaign[];
  loading: boolean;
  error: string | null;
};

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    heroes: [],
    pendingTurn: null,
    campaigns: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [heroes, pendingTurn, campaigns] = await Promise.all([
        heroApi.list().catch((err) => {
          console.error('Failed to load heroes:', err);
          return [];
        }),
        turnApi.pending().catch((err) => {
          console.error('Failed to load pending turns:', err);
          return { total: 0, next: null };
        }),
        campaignApi.listAvailable().catch((err) => {
          console.error('Failed to load available campaigns:', err);
          return [];
        }),
      ]);
      setState({ heroes, pendingTurn, campaigns, loading: false, error: null });
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Não foi possível carregar o dashboard.',
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
