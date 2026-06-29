import type { Hero } from '../../../../types';

type Props = { hero: Hero };

export function HeroIdentity({ hero }: Props) {
  return (
    <>
      <h1 className="hd-hero-name">{hero.name}</h1>
      <div className="hd-identity-rows">
        {hero.class && (
          <div className="hd-identity-row">
            <span className="hd-identity-label">Vocação / Classe</span>
            <span className="hd-chip hd-chip--class">{hero.class.name}</span>
          </div>
        )}
        {hero.ancestry && (
          <div className="hd-identity-row">
            <span className="hd-identity-label">Ancestralidade</span>
            <span className="hd-chip hd-chip--ancestry">{hero.ancestry.name}</span>
          </div>
        )}
        {hero.background && (
          <div className="hd-identity-row">
            <span className="hd-identity-label">Antecedente</span>
            <span className="hd-chip hd-chip--background">{hero.background.name}</span>
          </div>
        )}
      </div>
    </>
  );
}
