import { useState } from 'react';
import type { PointBuyRules } from './type';

interface Props {
  rules: PointBuyRules;
}

export function AttributeHelpCard({ rules }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="attr-help-card">
      <button
        type="button"
        className="attr-help-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="attr-help-toggle-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          COMO FUNCIONA O POINT BUY?
        </span>
        <svg
          className={`attr-help-chevron ${open ? 'attr-help-chevron--open' : ''}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="attr-help-body">
          <p>Você tem <strong>{rules.budget} pontos</strong> para gastar. Todo atributo começa em {rules.min}.</p>
          <p>Atributos mais altos custam mais pontos: 14 custa 7 pts e 15 custa 9 pts.</p>
          <p>Os bônus de antecedente são aplicados automaticamente e não consomem pontos.</p>
        </div>
      )}
    </div>
  );
}
