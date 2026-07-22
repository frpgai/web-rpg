import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { heroApi } from '../../../../../api/services/hero';
import { catalogApi } from '../../../../../api/services/catalog';
import type { HeroDetail, VocationDetails } from '../../../../../types';

// API calls for the aesthetics step's hero draft + vocation details (for the
// key-attribute label). Avatar presets/selection live in useAvatarSelection.
// No silent catches: every failure is logged and surfaced through an error
// string, nothing is swallowed.
export function useAestheticsData(heroId: string | null) {
  const [hero, setHero] = useState<HeroDetail | null>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);

  useEffect(() => {
    if (!heroId) {
      setHeroLoaded(true);
      return;
    }

    heroApi.get(heroId, 'draft')
      .then((data) => {
        setHero(data);
        setHeroLoaded(true);
      })
      .catch((err: unknown) => {
        console.error('useAestheticsData: failed to load hero draft', err);
        const message = 'Não foi possível carregar a criação em andamento.';
        setHeroError(message);
        toast.error(message);
        setHeroLoaded(true);
      });
  }, [heroId]);

  const [vocationDetails, setVocationDetails] = useState<VocationDetails | null>(null);
  useEffect(() => {
    if (!hero) return;
    catalogApi.vocationDetails(hero.vocation_id)
      .then(setVocationDetails)
      .catch((err: unknown) => {
        console.error('useAestheticsData: failed to load vocation details', err);
        toast.error('Não foi possível carregar os detalhes da vocação.');
      });
  }, [hero]);

  return {
    hero,
    heroLoaded,
    heroError,
    vocationDetails,
  };
}
