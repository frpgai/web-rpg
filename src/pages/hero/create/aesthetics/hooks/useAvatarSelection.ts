import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { catalogApi } from '../../../../../api/services/catalog';
import type { AvatarPreset, HeroDetail } from '../../../../../types';

// Avatar presets (fetch + list) and the user's current selection for the
// aesthetics step. No silent catches: load failure is logged and surfaced
// through avatarError, nothing is swallowed.
export function useAvatarSelection(hero: HeroDetail | null) {
  const [avatarList, setAvatarList] = useState<AvatarPreset[]>([]);
  const [avatarsLoading, setAvatarsLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState('');

  async function loadAvatars() {
    if (!hero?.ancestry_id || !hero?.vocation_id || !hero?.background_id) return;
    setAvatarsLoading(true);
    setAvatarError(null);
    try {
      const presets = await catalogApi.fetchAvatars(hero.ancestry_id, hero.vocation_id, hero.background_id);
      setAvatarList(presets);
    } catch (err: unknown) {
      console.error('useAvatarSelection: failed to load avatar presets', err);
      const message = 'Não foi possível carregar os avatares.';
      setAvatarError(message);
      toast.error(message);
    } finally {
      setAvatarsLoading(false);
    }
  }

  useEffect(() => {
    loadAvatars();
  }, [hero]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pick a default avatar once the preset list loads: the one matching the
  // hero's already-saved avatar_url, or the recommended preset otherwise.
  useEffect(() => {
    if (avatarList.length === 0 || avatarId) return;
    const heroAvatarUrl = hero?.avatar_url;
    const matching = heroAvatarUrl ? avatarList.find((p) => p.url === heroAvatarUrl) : undefined;
    const chosen = matching ?? avatarList.find((p) => p.recommended);
    if (chosen) {
      setAvatarId(chosen.id);
    }
  }, [avatarList, hero, avatarId]);

  const activePreset = avatarList.find((p) => p.id === avatarId) ?? avatarList[0] ?? null;

  return {
    avatarList,
    avatarsLoading,
    avatarError,
    reloadAvatars: loadAvatars,
    avatarId,
    setAvatarId,
    activePreset,
  };
}
