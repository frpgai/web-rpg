import './_AttributeGrid.css';
import type { HeroAttributes } from '../../../types';
import { POINT_BUY_COST } from '../../../constants/rules';

interface Props {
  attrs: HeroAttributes;
  remaining: number;
  attributeBonuses: Partial<Record<keyof HeroAttributes, number>>;
  eligibleAttributes: string[];
  asiPoolRemaining: number;
  asiMaxPerAttr: number;
  onSetAttr: (key: keyof HeroAttributes, val: number) => void;
}

const ATTR_ABBREV: Record<keyof HeroAttributes, string> = {
  str: 'FOR',
  dex: 'DES',
  con: 'CON',
  int: 'INT',
  wis: 'SAB',
  cha: 'CAR',
};

const ATTR_NAME: Record<keyof HeroAttributes, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

const ATTR_DESC: Record<keyof HeroAttributes, string> = {
  str: 'Poder físico puro e carga.',
  dex: 'Agilidade, reflexos e equilíbrio.',
  con: 'Resistência, vitalidade e saúde.',
  int: 'Poder mental, lógica e memória.',
  wis: 'Percepção, intuição e sintonização.',
  cha: 'Influência, charme e liderança.',
};

const ATTR_KEYS: (keyof HeroAttributes)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export function AttributeGrid({ attrs, remaining, attributeBonuses, eligibleAttributes, asiPoolRemaining, asiMaxPerAttr, onSetAttr }: Props) {
  return (
    <div className="attr-grid">
      {ATTR_KEYS.map((key) => {
        const purchased = attrs[key];
        const bonus = attributeBonuses[key] ?? 0;
        const total = purchased + bonus;
        const isTalent = total >= 14;
        const isWeakness = purchased === 8;
        const isEligible = eligibleAttributes.includes(key);
        const isHighlighted = isEligible && asiPoolRemaining > 0 && bonus < asiMaxPerAttr;

        const costToInc = (POINT_BUY_COST[purchased + 1] ?? 99) - POINT_BUY_COST[purchased];
        const canDecrement = purchased > 8;
        const canIncrement = purchased < 15 && remaining >= costToInc;

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
                <h3 className="attr-card-abbrev">{ATTR_ABBREV[key]}</h3>
                <p className="attr-card-name">{ATTR_NAME[key]}</p>
              </div>

              <div className="attr-card-controls">
                <button
                  type="button"
                  className="attr-btn attr-btn--dec"
                  disabled={!canDecrement}
                  onClick={() => onSetAttr(key, purchased - 1)}
                  aria-label={`Diminuir ${ATTR_ABBREV[key]}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>

                <span className="attr-card-value">{total}</span>

                <button
                  type="button"
                  className="attr-btn attr-btn--inc"
                  disabled={!canIncrement}
                  onClick={() => onSetAttr(key, purchased + 1)}
                  aria-label={`Aumentar ${ATTR_ABBREV[key]}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="attr-card-desc">{ATTR_DESC[key]}</p>

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
