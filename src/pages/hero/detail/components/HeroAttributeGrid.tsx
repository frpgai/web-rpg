import { useTranslation } from 'react-i18next';
import type { Hero } from '../../../../types';

const ATTR_ICON: Record<string, string> = {
  str: 'fitness_center',
  dex: 'bolt',
  con: 'favorite',
  int: 'psychology',
  wis: 'auto_awesome',
  cha: 'theater_comedy',
};

function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

type Props = { hero: Hero };

export function HeroAttributeGrid({ hero }: Props) {
  const { t } = useTranslation('attributes');

  if (!hero.attributes) return null;

  return (
    <div className="hd-attr-grid">
      {Object.entries(hero.attributes).map(([key, attr]) => (
        <div key={key} className="hd-attr-card">
          <span className="material-symbols-outlined hd-attr-icon">{ATTR_ICON[key] ?? 'star'}</span>
          <span className="hd-attr-abbr">{t(`${key}.abbreviation`) || key.toUpperCase()}</span>
          <span className="hd-attr-val">{attr.final}</span>
          <span className="hd-attr-mod">{fmtMod(attr.modifier)}</span>
        </div>
      ))}
    </div>
  );
}
