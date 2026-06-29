import { getAssetUrl } from '../../../../utils/url';
import type { Hero } from '../../../../types';

type Props = { hero: Hero };

export function HeroAvatar({ hero }: Props) {
  return (
    <div className="hd-avatar-wrap">
      {hero.avatar_url ? (
        <img
          src={getAssetUrl(hero.avatar_url)}
          alt={hero.name}
          className="hd-avatar"
        />
      ) : (
        <div className="hd-avatar-placeholder">
          <span className="material-symbols-outlined">person</span>
        </div>
      )}
      <div className="hd-level-badge">NÍVEL {hero.level}</div>
      <div className="hd-def-badge">
        <span className="material-symbols-outlined">shield</span>
        {hero.def}
      </div>
    </div>
  );
}
