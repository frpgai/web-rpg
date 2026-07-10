import type { Hero } from '../../../../types';
import { Avatar } from '../../../../components/ui/Avatar';

type Props = { hero: Hero };

export function HeroAvatar({ hero }: Props) {
  return (
    <div className="hd-avatar-wrap">
      <Avatar
        url={hero.avatar_url}
        name={hero.name}
        shape="rounded"
        className="hd-avatar"
      />
      <div className="hd-level-badge">NÍVEL {hero.level}</div>
      <div className="hd-def-badge">
        <span className="material-symbols-outlined">shield</span>
        {hero.def}
      </div>
    </div>
  );
}
