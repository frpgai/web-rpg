import { SvgIcon } from '../../../../components/ui/SvgIcon';
import { Tooltip } from '../../../../components/ui/Tooltip';
import type { Background } from '../../../../types';
import { ATTR_LABELS, ATTR_TOOLTIP, SECONDARY, formatBonuses } from './origins.utils';

interface BackgroundCardProps {
  background: Background;
  selected: boolean;
  onSelect: (background: Background) => void;
}

export function BackgroundCard({ background, selected, onSelect }: BackgroundCardProps) {
  const bonusStr = formatBonuses(background.attribute_bonuses);

  return (
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
          <Tooltip text={
            (background.attribute_bonuses?.eligible?.length
              ? background.attribute_bonuses.eligible
              : Object.keys(background.attribute_bonuses).filter(k => k !== 'eligible')
            ).map(a => `${ATTR_LABELS[a] ?? a.toUpperCase()}: ${ATTR_TOOLTIP[a] ?? a}`).join('\n')
          }>
            <span style={{ fontSize: 10, color: 'rgba(201,168,76,0.8)' }}></span>
          </Tooltip>
        </div>
      </div>
      {selected && <div className="origins-selected-bar" style={{ backgroundColor: SECONDARY }} />}
    </div>
  );
}
