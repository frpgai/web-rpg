import type { Hero } from '../../../../types';

type Props = { hero: Hero };

export function HeroStatusBars({ hero }: Props) {
  const hpPct = hero.hp_max  > 0 ? Math.min(100, (hero.hp_current / hero.hp_max)  * 100) : 0;
  const mpPct = hero.mp_max  > 0 ? Math.min(100, (hero.mp_current / hero.mp_max)  * 100) : 0;
  const xpPct = hero.xp_next_level > 0 ? Math.min(100, (hero.xp / hero.xp_next_level) * 100) : 0;

  return (
    <div className="hd-bars">
      <div className="hd-bar-row">
        <div className="hd-bar-label-row">
          <span className="hd-bar-label hd-bar-label--hp">VIDA</span>
          <span className="hd-bar-value">{hero.hp_current} / {hero.hp_max}</span>
        </div>
        <div className="hd-bar-track">
          <div className="hd-bar-fill hd-bar-fill--hp" style={{ width: `${hpPct}%` }} />
        </div>
      </div>

      <div className="hd-bar-row">
        <div className="hd-bar-label-row">
          <span className="hd-bar-label hd-bar-label--mp">MANA</span>
          <span className="hd-bar-value">{hero.mp_current} / {hero.mp_max}</span>
        </div>
        <div className="hd-bar-track">
          <div className="hd-bar-fill hd-bar-fill--mp" style={{ width: `${mpPct}%` }} />
        </div>
      </div>

      <div className="hd-bar-row">
        <div className="hd-bar-label-row">
          <span className="hd-bar-label hd-bar-label--xp">EXP</span>
          <span className="hd-bar-value">{hero.xp} / {hero.xp_next_level}</span>
        </div>
        <div className="hd-bar-track">
          <div className="hd-bar-fill hd-bar-fill--xp hd-bar-fill--xp-thin" style={{ width: `${xpPct}%` }} />
        </div>
      </div>
    </div>
  );
}
