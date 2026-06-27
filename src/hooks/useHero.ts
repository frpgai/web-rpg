import { useState, useEffect, useCallback } from 'react';
import { heroApi } from '../api/services/hero';
import type { HeroDetail } from '../types';

export interface UseHeroResult {
  hero: HeroDetail | null;
  loading: boolean;
  error: string | null;
  errorStatus: number | null;
  refresh: () => void;
}

export function useHero(id: string): UseHeroResult {
  const [hero, setHero] = useState<HeroDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setErrorStatus(null);

    heroApi
      .get(id)
      .then((data) => setHero(data))
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 403) {
          setErrorStatus(status);
          setError(
            status === 404
              ? 'Herói não encontrado'
              : 'Você não tem acesso a este herói',
          );
        } else {
          setError('Erro de conexão. Verifique sua internet.');
        }
      })
      .finally(() => setLoading(false));
  }, [id, tick]);

  return { hero, loading, error, errorStatus, refresh };
}
