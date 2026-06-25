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
  modifiers: Record<string, number>;
  loading?: boolean;
}

export function AttributeGrid({
  attrs, remaining, attributeBonuses, eligibleAttributes,
  asiPoolRemaining, asiMaxPerAttr, onSetAttr, rules, systemAttributes, modifiers, loading,
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
        const isEligible = eligibleAttributes.includes(key);
        const isHighlighted = isEligible && asiPoolRemaining > 0 && bonus < asiMaxPerAttr;

        const costToInc = (rules.costTable[purchased + 1] ?? 99) - (rules.costTable[purchased] ?? 0);
        const canDecrement = purchased > rules.min;
        const canIncrement = purchased < rules.max && remaining >= costToInc;

        return (
          <div
            key={key}
            className={`attr-card ${isHighlighted ? 'attr-card--eligible' : ''}`}
          >
            {/* Eligible badge */}
            {isHighlighted && (
              <div className="attr-card-eligible-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C17.5 22.15 21 17.25 21 12V6l-8-4z" />
                </svg>
                <span>ELEGÍVEL</span>
              </div>
            )}

            {/* Header: abbrev + name + controls */}
            <div className="attr-card-header">
              <div className="attr-card-title">
                <h3 className="attr-card-abbrev">{abbrevMap[key]}</h3>
                <p className="attr-card-name">{nameMap[key]}</p>
              </div>

              <div className="attr-card-controls">
                <button
                  type="button"
                  className="attr-btn attr-btn--dec"
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
                  className="attr-btn attr-btn--inc"
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

            {/* Description */}
            <p className="attr-card-desc">{descMap[key]}</p>

            {/* Status badges */}
            <div className="attr-card-badges">
              {bonus > 0 && (
                <span className="attr-badge attr-badge--bonus">
                  BASE: {purchased} ({bonus > 0 ? '+' : ''}{bonus} ANTECEDENTE)
                </span>
              )}
              {isTalent && (
                <span className="attr-badge attr-badge--talent">TALENTO</span>
              )}
              {isWeakness && (
                <span className="attr-badge attr-badge--weakness">FRAQUEZA</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
