import React from 'react';
import './_AttributeGrid.css';
import type { HeroAttributes } from '../../../types';
import { POINT_BUY_COST } from '../../../constants/rules';

interface Props {
  attrs: HeroAttributes;
  remaining: number;
  attributeBonuses: Partial<Record<keyof HeroAttributes, number>>;
  onSetAttr: (key: keyof HeroAttributes, val: number) => void;
}

export function AttributeGrid({ attrs, remaining, attributeBonuses, onSetAttr }: Props) {
  const ATTR_LABELS: Record<keyof HeroAttributes, string> = {
    str: 'FOR',
    dex: 'DES',
    con: 'CON',
    int: 'INT',
    wis: 'SAB',
    cha: 'CAR',
  };

  const ATTR_DESC: Record<keyof HeroAttributes, string> = {
    str: 'Poder físico puro e carga.',
    dex: 'Agilidade, reflexos e equilíbrio.',
    con: 'Resistência, vitalidade e saúde.',
    int: 'Poder mental, lógica e memória.',
    wis: 'Percepção, intuição e sintonização.',
    cha: 'Influência, charme e liderança.',
  };

  return (
    <div className="attribute-grid">
      {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as (keyof HeroAttributes)[]).map((key) => {
        const purchased = attrs[key];
        const bgBonus = attributeBonuses[key] ?? 0;
        const total = purchased + bgBonus;
        const isTalent = total >= 14;
        const isWeakness = purchased === 8;
        const costToIncrement = (POINT_BUY_COST[purchased + 1] ?? 99) - POINT_BUY_COST[purchased];
        const canDecrement = purchased > 8;
        const canIncrement = purchased < 15 && remaining >= costToIncrement;
        let subLabel = 'SEM BÔNUS';
        if (isWeakness) subLabel = 'FRAQUEZA';
        else if (isTalent) subLabel = 'TALENTO';
        else if (bgBonus !== 0) subLabel = `BASE: ${purchased} (${bgBonus > 0 ? '+' : ''}${bgBonus} RAÇA)`;

        return (
          <div key={key} className="attribute-card">
            <div className="card-top">
              <div className="card-header">
                <div className="card-name">{ATTR_LABELS[key]}</div>
                <div className="card-desc">{ATTR_DESC[key]}</div>
              </div>
              {bgBonus !== 0 && (
                <div className="bonus-circle active">
                  {bgBonus > 0 ? '+' : ''}{bgBonus}
                </div>
              )}
            </div>
            <div className="card-bottom">
              <div className="value-col">
                <div className="value">{String(total).padStart(2, '0')}</div>
                <div className="sub-label" style={{ color: isWeakness ? '#ff6b6b' : undefined }}>{subLabel}</div>
              </div>
              <div className="controls">
                <button className="btn" disabled={!canDecrement} onClick={() => onSetAttr(key, purchased - 1)}>-</button>
                <button className="btn plus" disabled={!canIncrement} onClick={() => onSetAttr(key, purchased + 1)}>+</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
