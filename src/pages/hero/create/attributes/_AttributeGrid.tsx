import './_AttributeGrid.css';
import type { HeroAttributes } from '../../../../types';
import type { PointBuyRules } from '../../../../hooks/usePointBuyRules';
import type { SystemAttribute } from '../../../../api/services/attributes';

interface Props {
  attrs: HeroAttributes;
  remaining: number;
  attributeBonuses: Partial<Record<keyof HeroAttributes, number>>;
  eligibleAttributes: string[];
  asiPoolRemaining: number;
  asiMaxPerAttr: number;
  onSetAttr: (key: keyof HeroAttributes, val: number) => void;
  rules: PointBuyRules;
  systemAttributes: SystemAttribute[];
  loading?: boolean;
}

export function AttributeGrid({
  attrs, remaining, attributeBonuses, eligibleAttributes,
  asiPoolRemaining, asiMaxPerAttr, onSetAttr, rules, systemAttributes, loading,
}: Props) {
  if (loading || systemAttributes.length === 0) {
    return (
      <div className="attr-grid-skeleton">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="attr-grid-skeleton-card" />
        ))}
      </div>
    );
  }

  // Derived exclusively from API data — no static fallbacks
  const attrKeys = systemAttributes.map((a) => a.slug as keyof HeroAttributes);
  const abbrevMap = Object.fromEntries(systemAttributes.map((a) => [a.slug, a.abbreviation]));
  const nameMap = Object.fromEntries(systemAttributes.map((a) => [a.slug, a.name]));
  const descMap = Object.fromEntries(systemAttributes.map((a) => [a.slug, a.description]));

  return (
    <div className="attr-grid">
      {attrKeys.map((key) => {
        const purchased = attrs[key] ?? rules.min;
        const bonus = attributeBonuses[key] ?? 0;
        const total = purchased + bonus;
        const isTalent = total >= 14;
        const isWeakness = purchased === rules.min;
        const systemAttr = systemAttributes.find((sa) => sa.slug === key);
        const isEligible = systemAttr ? eligibleAttributes.includes(systemAttr.id) : false;
        const isHighlighted = isEligible && asiPoolRemaining > 0 && bonus < asiMaxPerAttr;

        const costToInc = (rules.costTable[purchased + 1] ?? 99) - (rules.costTable[purchased] ?? 0);
        const canDecrement = purchased > rules.min || bonus > 0;
        const canIncrement = purchased < rules.max && (remaining >= costToInc || isHighlighted);

        return (
          <div
            key={key}
            className={`attr-card ${isHighlighted ? 'attr-card--eligible' : ''}`}
          >
            <div className="attr-card-left">
              <div className="attr-card-icon-group">
                <div className={`attr-card-icon ${isHighlighted ? 'attr-card-icon--eligible' : ''}`}>
                  <span className="attr-card-abbrev">{abbrevMap[key]}</span>
                </div>
                {bonus > 0 && (
                  <span className="attr-badge-sub attr-badge-sub--bonus">
                    +{bonus} ANT
                  </span>
                )}
                {isTalent && (
                  <span className="attr-badge-sub attr-badge-sub--talent">
                    TALENTO
                  </span>
                )}
                {isWeakness && (
                  <span className="attr-badge-sub attr-badge-sub--weakness">
                    FRAQUEZA
                  </span>
                )}
              </div>
              <div className="attr-card-info">
                <h3 className="attr-card-name">{nameMap[key]}</h3>
                <p className="attr-card-desc">{descMap[key]}</p>
              </div>
            </div>

            <div className="attr-card-controls">
              <button
                type="button"
                className={`attr-btn attr-btn--dec${isHighlighted ? ' attr-btn--dec-eligible' : ''}`}
                disabled={!canDecrement}
                onClick={() => onSetAttr(key, purchased - 1)}
                aria-label={`Diminuir ${abbrevMap[key]}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>

              <span className="attr-card-value">
                {total}
              </span>

              <button
                type="button"
                className={`attr-btn attr-btn--inc${isHighlighted ? ' attr-btn--inc-eligible' : ''}`}
                disabled={!canIncrement}
                onClick={() => onSetAttr(key, purchased + 1)}
                aria-label={`Aumentar ${abbrevMap[key]}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
