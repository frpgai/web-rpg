import { useState } from 'react';
import { SvgIcon } from '../../../../components/ui/SvgIcon';
import { BottomSheet } from '../../../../components/ui/BottomSheet';
import type { Vocation, VocationDetails } from '../../../../types';
import { ATTR_LABELS, PRIMARY } from './origins.utils';
import { catalogApi } from '../../../../api/services/catalog';

interface VocationCardProps {
  vocation: Vocation;
  selected: boolean;
  onSelect: (vocation: Vocation) => void;
}

export function VocationCard({ vocation, selected, onSelect }: VocationCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [details, setDetails] = useState<VocationDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const attrLabel = ATTR_LABELS[vocation.key_attribute] ?? vocation.key_attribute.toUpperCase();

  async function handleInfo(e: React.MouseEvent) {
    e.stopPropagation();
    setSheetOpen(true);
    if (!details) {
      setDetailsLoading(true);
      try {
        const d = await catalogApi.vocationDetails(vocation.id);
        setDetails(d);
      } catch {
        // ignore
      } finally {
        setDetailsLoading(false);
      }
    }
  }

  return (
    <>
      <div
        className={`origins-row-card ${selected ? 'origins-row-card-selected' : ''}`}
        onClick={() => onSelect(vocation)}
      >
        <div className={`origins-row-icon-circle ${selected ? 'origins-row-icon-circle-primary-selected' : ''}`}>
          {vocation.icon ? (
            <SvgIcon
              name={vocation.icon}
              size={22}
              color={selected ? PRIMARY : '#ccc3d3'}
            />
          ) : (
            <span style={{ fontSize: 18, color: selected ? PRIMARY : '#ccc3d3' }}>⚔</span>
          )}
        </div>
        <div className="origins-row-card-content">
          <h3 className={`origins-row-card-name ${selected ? 'origins-row-card-name-primary' : ''}`}>
            {vocation.name}
          </h3>
          <p className="origins-row-card-desc">
            {vocation.description}
          </p>
          <div className="origins-attr-badge">
            <span className="origins-attr-badge-text">{attrLabel}</span>
          </div>
        </div>
        <button
          className="origins-card-info-btn"
          onClick={handleInfo}
          aria-label={`Detalhes de ${vocation.name}`}
          type="button"
        >
          ⓘ
        </button>
        {selected && <div className="origins-selected-bar" />}
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={vocation.name}
      >
        <div className="bottom-sheet-info-row">
          <span className="bottom-sheet-info-label">HP Base</span>
          <span className="bottom-sheet-info-value">d{vocation.hit_die}</span>
        </div>
        <div className="bottom-sheet-info-row">
          <span className="bottom-sheet-info-label">Atributo-chave</span>
          <span className="bottom-sheet-info-value">{attrLabel}</span>
        </div>
        {vocation.is_spellcaster && (
          <div className="bottom-sheet-info-row">
            <span className="bottom-sheet-info-label">Conjurador</span>
            <span className="bottom-sheet-info-value" style={{ color: 'var(--color-tertiary)' }}>Sim</span>
          </div>
        )}

        {detailsLoading && (
          <p className="origins-error-text">Carregando detalhes…</p>
        )}

        {details && details.starting_items.length > 0 && (
          <>
            <p className="bottom-sheet-section-label">Itens Iniciais</p>
            {details.starting_items.map((item) => (
              <div key={item.item_id} className="bottom-sheet-info-row">
                <span className="bottom-sheet-info-label">{item.name}</span>
                <span className="bottom-sheet-info-value">x{item.quantity}</span>
              </div>
            ))}
          </>
        )}

        {details && details.traits.length > 0 && (
          <>
            <p className="bottom-sheet-section-label" style={{ marginTop: 'var(--space-sm)' }}>Traços</p>
            {details.traits.map((trait) => (
              <div key={trait.id} className="bottom-sheet-trait-item">
                <p className="bottom-sheet-trait-name">{trait.name}</p>
                <p className="bottom-sheet-trait-desc">{trait.description}</p>
              </div>
            ))}
          </>
        )}
      </BottomSheet>
    </>
  );
}
