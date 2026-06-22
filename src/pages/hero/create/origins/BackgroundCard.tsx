import { useState } from 'react';
import { SvgIcon } from '../../../../components/ui/SvgIcon';
import { BottomSheet } from '../../../../components/ui/BottomSheet';
import type { Background } from '../../../../types';
import { ATTR_LABELS, SECONDARY, formatBonuses } from './origins.utils';

interface BackgroundCardProps {
  background: Background;
  selected: boolean;
  onSelect: (background: Background) => void;
}

export function BackgroundCard({ background, selected, onSelect }: BackgroundCardProps) {
  const bonusStr = formatBonuses(background.bonuses);
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleInfo(e: React.MouseEvent) {
    e.stopPropagation();
    setSheetOpen(true);
  }

  const eligible = background.eligible_attributes ?? [];

  return (
    <>
      <div
        className={`origins-row-card ${selected ? 'origins-row-card-selected' : ''}`}
        onClick={() => onSelect(background)}
      >
        <div className={`origins-row-icon-circle origins-row-icon-circle-secondary ${selected ? 'origins-row-icon-circle-secondary-selected' : ''}`}>
          <SvgIcon
            name={background.icon}
            size={22}
            color={selected ? SECONDARY : '#ccc3d3'}
          />
        </div>
        <div className="origins-row-card-content">
          <h3 className={`origins-row-card-name ${selected ? 'origins-row-card-name-secondary' : ''}`}>
            {background.name}
          </h3>
          <div className="origins-bg-bonus-badge">
            <span className="origins-bg-bonus-badge-text">{bonusStr}</span>
          </div>
        </div>
        <button
          className="origins-card-info-btn"
          onClick={handleInfo}
          aria-label={`Detalhes de ${background.name}`}
          type="button"
        >
          ⓘ
        </button>
        {selected && <div className="origins-selected-bar" style={{ backgroundColor: SECONDARY }} />}
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={background.name}
      >
        {eligible.length > 0 && (
          <>
            <p className="bottom-sheet-section-label">Atributos Elegíveis</p>
            <div className="bottom-sheet-attrs-list">
              {eligible.map((attr) => (
                <span key={attr} className="bottom-sheet-attr-chip">
                  {ATTR_LABELS[attr] ?? attr.toUpperCase()}
                </span>
              ))}
            </div>
          </>
        )}
        <p className="origins-error-text">{background.description}</p>
      </BottomSheet>
    </>
  );
}
