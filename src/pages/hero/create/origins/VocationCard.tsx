import { SvgIcon } from '../../../../components/ui/SvgIcon';
import { Tooltip } from '../../../../components/ui/Tooltip';
import type { CharacterClass } from '../../../../types';
import { ATTR_LABELS, ATTR_TOOLTIP, PRIMARY } from './origins.utils';

interface VocationCardProps {
  vocation: CharacterClass;
  selected: boolean;
  onSelect: (vocation: CharacterClass) => void;
}

export function VocationCard({ vocation, selected, onSelect }: VocationCardProps) {
  return (
    <div
      className={`origins-row-card ${selected ? 'origins-row-card-selected' : ''}`}
      onClick={() => onSelect(vocation)}
    >
      <div className={`origins-row-icon-circle ${selected ? 'origins-row-icon-circle-primary-selected' : ''}`}>
        <SvgIcon
          name={vocation.icon}
          size={22}
          color={selected ? PRIMARY : '#ccc3d3'}
        />
      </div>
      <div className="origins-row-card-content">
        <h3 className={`origins-row-card-name ${selected ? 'origins-row-card-name-primary' : ''}`}>
          {vocation.name}
        </h3>
        <p className="origins-row-card-desc">
          {vocation.description}
        </p>
        <div className="origins-attr-badge">
          <SvgIcon
            name={vocation.key_attribute}
            size={10}
            color={PRIMARY}
          />
          <span className="origins-attr-badge-text">
            {ATTR_LABELS[vocation.key_attribute] ?? vocation.key_attribute.toUpperCase()}
          </span>
          <Tooltip text={`${vocation.name}s dependem de ${ATTR_TOOLTIP[vocation.key_attribute]?.split(' — ')[0] ?? ATTR_LABELS[vocation.key_attribute] ?? vocation.key_attribute.toUpperCase()} — vale a pena investir pontos nela no próximo passo`}>
            <span style={{ fontSize: 1, color: 'transparent' }}></span>
          </Tooltip>
        </div>
      </div>
      {selected && <div className="origins-selected-bar" />}
    </div>
  );
}
