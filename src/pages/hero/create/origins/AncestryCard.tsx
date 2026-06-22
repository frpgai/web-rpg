import { useState } from 'react';
import { SvgIcon } from '../../../../components/ui/SvgIcon';
import { BottomSheet } from '../../../../components/ui/BottomSheet';
import type { Ancestry } from '../../../../types';
import { PRIMARY } from './origins.utils';

interface AncestryCardProps {
  ancestry: Ancestry;
  selected: boolean;
  onSelect: (ancestry: Ancestry) => void;
}

export function AncestryCard({ ancestry, selected, onSelect }: AncestryCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleInfo(e: React.MouseEvent) {
    e.stopPropagation();
    setSheetOpen(true);
  }

  const traitsToShow = ancestry.traits ?? [];

  return (
    <>
      <div
        className={`origins-ancestry-card ${selected ? 'origins-ancestry-card-selected' : ''}`}
        onClick={() => onSelect(ancestry)}
      >
        <button
          className="origins-card-info-btn"
          onClick={handleInfo}
          aria-label={`Detalhes de ${ancestry.name}`}
          type="button"
        >
          ⓘ
        </button>
        <SvgIcon
          name={ancestry.icon}
          size={32}
          color={selected ? PRIMARY : '#ccc3d3'}
        />
        <span className={`origins-ancestry-card-name ${selected ? 'origins-ancestry-card-name-selected' : ''}`}>
          {ancestry.name}
        </span>
        {ancestry.traits && ancestry.traits.length > 0 && (
          <span className="origins-ancestry-card-traits">
            {ancestry.traits.slice(0, 2).map((t) => t.name).join(' • ')}
          </span>
        )}
        {selected && <div className="origins-selected-bar" />}
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={ancestry.name}
      >
        {traitsToShow.length > 0 ? (
          traitsToShow.map((trait) => (
            <div key={trait.id} className="bottom-sheet-trait-item">
              <p className="bottom-sheet-trait-name">{trait.name}</p>
              <p className="bottom-sheet-trait-desc">{trait.description}</p>
            </div>
          ))
        ) : (
          <p className="origins-error-text">{ancestry.description}</p>
        )}
      </BottomSheet>
    </>
  );
}
