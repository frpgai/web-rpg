import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAssetUrl } from '../../../../utils/url';
import type { Hero, HeroAbility } from '../../../../types';

type TabKey = 'abilities' | 'backstory' | 'notes';

function AbilityCard({ ability }: { ability: HeroAbility }) {
  const { t } = useTranslation('common');
  const type = ability.type;
  const isPassive = type === 'passive';
  return (
    <div className={`hd-ability-card hd-ability-card--${type}`}>
      <div className="hd-ability-header">
        <div className="hd-ability-title-row">
          {ability.image_url ? (
            <img src={getAssetUrl(ability.image_url)} alt={ability.name} className="hd-ability-icon" />
          ) : (
            <span className="material-symbols-outlined hd-ability-icon-fallback">auto_fix_high</span>
          )}
          <h4 className={`hd-ability-name hd-ability-name--${type}`}>{ability.name}</h4>
        </div>
        <span className={`hd-ability-badge hd-ability-badge--${type}`}>
          {t(`ability_type.${type}`) || type}
        </span>
      </div>
      <p className="hd-ability-desc">{ability.description}</p>
      <div className="hd-ability-footer">
        {ability.mana_cost > 0 && (
          <span className={`hd-ability-meta hd-ability-meta--${isPassive ? 'passive' : 'action'}`}>
            Custo: {ability.mana_cost} MP
          </span>
        )}
        <span className={`hd-ability-meta hd-ability-meta--${isPassive ? 'passive' : 'action'}`}>
          Alcance: {t(`ability_range.${ability.range}`, { ns: 'common', defaultValue: ability.range })}
        </span>
      </div>
    </div>
  );
}

type Props = { hero: Hero };

export function HeroTabs({ hero }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('abilities');

  return (
    <section className="hd-tabs-section">
      <div className="hd-tabs-bar">
        {(['abilities', 'backstory', 'notes'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            className={`hd-tab-btn${activeTab === tab ? ' hd-tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'abilities' && 'Habilidades'}
            {tab === 'backstory' && 'História'}
            {tab === 'notes'     && 'Notas'}
          </button>
        ))}
      </div>

      {activeTab === 'abilities' && (
        <div className="hd-abilities-grid">
          {hero.abilities && hero.abilities.length > 0 ? (
            hero.abilities.map((ab) => <AbilityCard key={ab.id} ability={ab} />)
          ) : (
            <p className="hd-empty-text">Nenhuma habilidade registrada.</p>
          )}
        </div>
      )}

      {activeTab === 'backstory' && (
        <div className="hd-glass-panel">
          <p className="hd-backstory-text">
            {hero.backstory || 'Este herói ainda não tem uma história escrita.'}
          </p>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="hd-glass-panel hd-notes-empty">
          <span className="material-symbols-outlined hd-notes-icon">edit_note</span>
          <p className="hd-notes-label">Nenhuma nota registrada.</p>
        </div>
      )}
    </section>
  );
}
