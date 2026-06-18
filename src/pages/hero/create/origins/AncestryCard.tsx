import { SvgIcon } from '../../../../components/ui/SvgIcon';
import type { Ancestry } from '../../../../types';
import { PRIMARY } from './origins.utils';

interface AncestryCardProps {
  ancestry: Ancestry;
  selected: boolean;
  onSelect: (ancestry: Ancestry) => void;
}

export function AncestryCard({ ancestry, selected, onSelect }: AncestryCardProps) {
  return (
    <div
      key={ancestry.id}
      className={`origins-ancestry-card ${selected ? 'origins-ancestry-card-selected' : ''}`}
      onClick={() => onSelect(ancestry)}
    >
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
          {ancestry.traits.slice(0, 2).join(' • ')}
        </span>
      )}
      {selected && <div className="origins-selected-bar" />}
    </div>
  );
}
