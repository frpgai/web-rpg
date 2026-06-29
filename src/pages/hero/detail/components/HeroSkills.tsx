import { useState } from 'react';
import type { Hero } from '../../../../types';

function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

type Props = {
  hero: Hero;
};

export function HeroSkills({ hero }: Props) {
  const [showOnlyProficient, setShowOnlyProficient] = useState(false);

  const skillMod = (skill: { base_ability: string; proficient: boolean }) => {
    const attrMod = hero.attributes?.[skill.base_ability]?.modifier
      ?? Math.floor(((hero.attributes?.[skill.base_ability]?.final ?? 10) - 10) / 2);
    return attrMod + (skill.proficient ? hero.proficiency_bonus : 0);
  };

  const filtered = (hero.skills ?? []).filter((s) => !showOnlyProficient || s.proficient);

  return (
    <section className="hd-section">
      <div className="hd-section-header-with-toggle">
        <h2 className="hd-section-title" style={{ margin: 0 }}>
          <span className="material-symbols-outlined">history_edu</span>
          Perícias
        </h2>
        <button
          className="hd-skills-toggle-btn"
          onClick={() => setShowOnlyProficient(!showOnlyProficient)}
        >
          {showOnlyProficient ? 'Mostrar Todas' : 'Apenas Treinadas'}
        </button>
      </div>
      <div className="hd-skills-list">
        {filtered.map((skill) => (
          <div
            key={skill.slug}
            className={`hd-skill-row${skill.proficient ? ' hd-skill-row--proficient' : ''}`}
          >
            <span className={`hd-skill-dot${skill.proficient ? ' hd-skill-dot--proficient' : ''}`} />
            <span className="hd-skill-name">{skill.name}</span>
            <span className="hd-skill-attr">{skill.base_ability.toUpperCase()}</span>
            <span className="hd-skill-mod">{fmtMod(skillMod(skill))}</span>
          </div>
        ))}
        {showOnlyProficient && filtered.length === 0 && (
          <div className="hd-empty-text" style={{ padding: 'var(--space-md)' }}>
            Nenhuma perícia treinada.
          </div>
        )}
      </div>
    </section>
  );
}
