import { SvgIcon } from '../../../../components/ui/SvgIcon';
import { Tooltip } from '../../../../components/ui/Tooltip';
import type { Ancestry, Background, Vocation } from '../../../../types';
import type { PreviewResult } from '../../../../types';
import { ATTR_LABELS, KEY_ATTR_PT, SECONDARY } from './origins.utils';

interface DestinySpectrumProps {
  ancestry: Ancestry | null;
  background: Background | null;
  vocation: Vocation | null;
  preview: PreviewResult | null;
  previewLoading: boolean;
  previewError: string | null;
}

function formatSpellSlots(slots: Record<string, number> | null | undefined): string | null {
  if (!slots) return null;
  const entries = Object.entries(slots).filter(([, qty]) => qty > 0);
  if (entries.length === 0) return null;
  return entries.map(([lvl, qty]) => `${qty} slot${qty > 1 ? 's' : ''} nv${lvl}`).join(', ');
}

export function DestinySpectrum({
  ancestry,
  background,
  vocation,
  preview,
  previewLoading,
  previewError,
}: DestinySpectrumProps) {
  const eligibleAttrs = background?.eligible_attributes ?? [];

  const eligibleLabel = eligibleAttrs.length > 0
    ? eligibleAttrs.map((a) => ATTR_LABELS[a] ?? a.toUpperCase()).join(' / ')
    : null;

  const spellSlotsLabel = preview?.is_spellcaster
    ? formatSpellSlots(vocation?.spell_slots_by_level)
    : null;

  return (
    <div className="origins-spectrum-panel">
      <div className="origins-spectrum-image-area">
        <div className="origins-spectrum-image-placeholder">
          <SvgIcon name="eye-outline" size={48} color="rgba(215, 186, 255, 0.25)" />
        </div>
        <div className="origins-spectrum-image-gradient" />
        <div className="origins-spectrum-image-label">
          <span className="origins-spectrum-reveal-label">REVELAÇÃO</span>
          <h2 className="origins-spectrum-title">ESPECTRO DO DESTINO</h2>
        </div>
      </div>

      <div className="origins-spectrum-body">
        <div className="origins-spectrum-row">
          <span className="origins-spectrum-row-label">ANCESTRALIDADE</span>
          <span className="origins-spectrum-row-value">{ancestry?.name ?? '—'}</span>
        </div>
        <div className="origins-spectrum-row">
          <span className="origins-spectrum-row-label">Antecedente</span>
          <div className="origins-spectrum-row-right">
            <span className="origins-spectrum-row-value">{background?.name ?? '—'}</span>
            {eligibleLabel ? (
              <span className="origins-spectrum-bonus-text">{eligibleLabel}</span>
            ) : null}
          </div>
        </div>
        <div className="origins-spectrum-row">
          <span className="origins-spectrum-row-label">Vocação</span>
          <span className="origins-spectrum-row-value">{vocation?.name ?? '—'}</span>
        </div>

        {/* Sinergia Inicial */}
        <div className="origins-spectrum-sinergia-section">
          <div className="origins-spectrum-sinergia-header-row">
            <span className="origins-spectrum-sinergia-label">Sinergia Inicial</span>
            {previewError !== null && (
              <SvgIcon name="alert-circle-outline" size={14} color="rgba(204, 195, 211, 0.5)" />
            )}
          </div>

          <div className="origins-spectrum-stats-row">
            <div className="origins-spectrum-stat-box">
              <span className="origins-spectrum-stat-label">HP</span>
              {previewLoading ? (
                <div className="origins-spectrum-stat-skeleton" />
              ) : (
                <span className="origins-spectrum-stat-value">
                  {preview?.base_hp != null ? String(preview.base_hp).padStart(2, '0') : '—'}
                </span>
              )}
            </div>
            <div className="origins-spectrum-stat-box">
              <span className="origins-spectrum-stat-label">MP</span>
              {previewLoading ? (
                <div className="origins-spectrum-stat-skeleton" />
              ) : (
                <span className="origins-spectrum-stat-value">
                  {'—'}
                </span>
              )}
            </div>
            <div className="origins-spectrum-stat-box">
              <span className="origins-spectrum-stat-label">DEF</span>
              {previewLoading ? (
                <div className="origins-spectrum-stat-skeleton" />
              ) : (
                <span className="origins-spectrum-stat-value">
                  {preview?.base_def != null ? String(preview.base_def).padStart(2, '0') : '—'}
                </span>
              )}
            </div>
          </div>

          {/* Spell Slots — apenas para conjuradores */}
          {(previewLoading || spellSlotsLabel) && (
            <div className="origins-spectrum-row" style={{ marginTop: '4px' }}>
              <span className="origins-spectrum-row-label">Spell Slots</span>
              {previewLoading ? (
                <div className="origins-spectrum-row-skeleton" />
              ) : (
                <span className="origins-spell-slots-badge">{spellSlotsLabel}</span>
              )}
            </div>
          )}

          {/* Key attribute row */}
          <div className="origins-spectrum-row" style={{ marginTop: '8px' }}>
            <Tooltip text="O atributo que mais influencia as magias e habilidades desta vocação">
              <span className="origins-spectrum-row-label">Atributo-chave</span>
            </Tooltip>
            {previewLoading ? (
              <div className="origins-spectrum-row-skeleton" />
            ) : (
              <span className="origins-spectrum-row-value">
                {preview?.key_attribute
                  ? (KEY_ATTR_PT[preview.key_attribute] ?? preview.key_attribute.toUpperCase())
                  : '—'}
              </span>
            )}
          </div>

          {/* Eligible attributes from background */}
          {eligibleLabel && (
            <div className="origins-spectrum-row">
              <span className="origins-spectrum-row-label">Attrs Elegíveis</span>
              <span className="origins-spectrum-row-value" style={{ color: SECONDARY }}>
                {eligibleLabel}
              </span>
            </div>
          )}

          {/* Traits row */}
          {(preview?.traits && preview.traits.length > 0) && (
            <div className="origins-spectrum-traits-section">
              <Tooltip text="Características inatas da ancestralidade — não são habilidades ativas, fazem parte de quem o personagem é">
                <span className="origins-spectrum-row-label">Traços</span>
              </Tooltip>
              <div className="origins-spectrum-traits-list">
                {preview.traits.map((trait, idx) => (
                  <div key={idx} className="origins-spectrum-trait-badge">
                    <span className="origins-spectrum-trait-text">{typeof trait === 'string' ? trait : trait.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="origins-spectrum-quote">
          "A alma ainda é um vulto informe. Escolha suas amarras para que possamos traçar sua jornada através do Ethereal Rift."
        </p>
      </div>
    </div>
  );
}
