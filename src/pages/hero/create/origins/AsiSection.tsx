import { useState } from 'react';
import type { Background } from '../../../../types';
import { ATTR_LABELS, ATTR_TOOLTIP } from './origins.utils';
import './AsiSection.css';

// Tooltip constants
const ASI_TOOLTIP =
  'Aumento de Atributo — pontos extras que o antecedente concede; não consomem o pool de point-buy';
const PLUS_TOOLTIP =
  '+2 em um atributo, +1 em outro — ou +1 nos três; você escolhe como distribuir';

interface AsiSectionProps {
  background: Background;
  asiPlus2: string | null;
  asiPlus1: string | null;
  asiAllPlus1: boolean;
  onSetPlus2: (attr: string | null) => void;
  onSetPlus1: (attr: string | null) => void;
  onSetAllPlus1: (v: boolean) => void;
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="origins-asi-tooltip-anchor"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
    >
      {children}
      {visible && (
        <span className="origins-asi-tooltip-bubble" role="tooltip">
          {text}
        </span>
      )}
    </span>
  );
}

export function AsiSection({
  background,
  asiPlus2,
  asiPlus1,
  asiAllPlus1,
  onSetPlus2,
  onSetPlus1,
  onSetAllPlus1,
}: AsiSectionProps) {
  // Determine eligible attributes from background
  const eligible: string[] = background.eligible_attributes ?? [];

  // If no eligible (fixed bonuses only), don't render
  if (eligible.length === 0) return null;

  function handleToggleAllPlus1() {
    if (asiAllPlus1) {
      onSetAllPlus1(false);
    } else {
      onSetAllPlus1(true);
      onSetPlus2(null);
      onSetPlus1(null);
    }
  }

  function handlePlus2(attr: string) {
    if (asiAllPlus1) return;
    onSetPlus2(attr === asiPlus2 ? null : attr);
    // Clear plus1 if it's the same attr
    if (asiPlus1 === attr) onSetPlus1(null);
  }

  function handlePlus1(attr: string) {
    if (asiAllPlus1) return;
    onSetPlus1(attr === asiPlus1 ? null : attr);
    // Clear plus2 if it's the same attr
    if (asiPlus2 === attr) onSetPlus2(null);
  }

  return (
    <div className="origins-asi-section">
      {/* Header */}
      <div className="origins-asi-header">
        <span className="origins-asi-icon">⚡</span>
        <h4 className="origins-asi-title">
          Distribuição de&nbsp;
          <Tooltip text={ASI_TOOLTIP}>
            <span className="origins-asi-title-abbr">ASI</span>
          </Tooltip>
        </h4>
      </div>

      {/* Opção B — all +1 */}
      <button
        type="button"
        className={`origins-asi-allplus1-btn${asiAllPlus1 ? ' origins-asi-allplus1-btn-active' : ''}`}
        onClick={handleToggleAllPlus1}
        aria-pressed={asiAllPlus1}
      >
        <span className="origins-asi-allplus1-label">Distribuir +1/+1/+1</span>
        <span className="origins-asi-allplus1-hint">+1 em todos os elegíveis</span>
      </button>

      {/* Opção A — +2 e +1 */}
      <div className={`origins-asi-selectors${asiAllPlus1 ? ' origins-asi-selectors-disabled' : ''}`}>
        {/* +2 */}
        <div className="origins-asi-selector-group">
          <div className="origins-asi-selector-label">
            <Tooltip text={PLUS_TOOLTIP}>
              <span className="origins-asi-selector-label-text">+2 em:</span>
            </Tooltip>
          </div>
          <div className="origins-asi-chips">
            {eligible.map((attr) => {
              const label = ATTR_LABELS[attr] ?? attr.toUpperCase();
              const tip = ATTR_TOOLTIP[attr] ?? label;
              const selected = asiPlus2 === attr;
              const disabled = asiAllPlus1 || asiPlus1 === attr;
              return (
                <Tooltip key={attr} text={tip}>
                  <button
                    type="button"
                    className={`origins-asi-chip${selected ? ' origins-asi-chip-selected' : ''}${disabled ? ' origins-asi-chip-disabled' : ''}`}
                    onClick={() => handlePlus2(attr)}
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-label={`+2 em ${label}: ${tip}`}
                  >
                    {label}
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* +1 */}
        <div className="origins-asi-selector-group">
          <div className="origins-asi-selector-label">
            <Tooltip text={PLUS_TOOLTIP}>
              <span className="origins-asi-selector-label-text">+1 em:</span>
            </Tooltip>
          </div>
          <div className="origins-asi-chips">
            {eligible.map((attr) => {
              const label = ATTR_LABELS[attr] ?? attr.toUpperCase();
              const tip = ATTR_TOOLTIP[attr] ?? label;
              const selected = asiPlus1 === attr;
              const disabled = asiAllPlus1 || asiPlus2 === attr;
              return (
                <Tooltip key={attr} text={tip}>
                  <button
                    type="button"
                    className={`origins-asi-chip${selected ? ' origins-asi-chip-selected' : ''}${disabled ? ' origins-asi-chip-disabled' : ''}`}
                    onClick={() => handlePlus1(attr)}
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-label={`+1 em ${label}: ${tip}`}
                  >
                    {label}
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
