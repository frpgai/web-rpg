import type { Background } from '../../../../types';
import { ATTR_LABELS, PRIMARY } from './origins.utils';
import { SvgIcon } from '../../../../components/ui/SvgIcon';

interface AsiSectionProps {
  background: Background;
  asiPlus2: string | null;
  asiPlus1: string | null;
  asiAllPlus1: boolean;
  onSetPlus2: (attr: string | null) => void;
  onSetPlus1: (attr: string | null) => void;
  onSetAllPlus1: (val: boolean) => void;
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
  const eligible = background.eligible_attributes
    ?? background.attribute_bonuses?.eligible
    ?? Object.keys(background.attribute_bonuses ?? {}).filter((k) => k !== 'eligible');

  function handleOptionB() {
    onSetAllPlus1(true);
    onSetPlus2(null);
    onSetPlus1(null);
  }

  function handleSelectPlus2(attr: string) {
    onSetAllPlus1(false);
    onSetPlus2(attr);
    if (asiPlus1 === attr) onSetPlus1(null);
  }

  function handleSelectPlus1(attr: string) {
    onSetAllPlus1(false);
    onSetPlus1(attr);
    if (asiPlus2 === attr) onSetPlus2(null);
  }

  const availableForPlus1 = eligible.filter((a) => a !== asiPlus2);
  const availableForPlus2 = eligible.filter((a) => a !== asiPlus1);

  return (
    <div className="origins-asi-section">
      <div className="origins-asi-header">
        <SvgIcon name="star" size={20} color={PRIMARY} />
        <p className="origins-asi-title">Distribuir Atributos (ASI)</p>
      </div>

      <p className="origins-asi-desc">
        Escolha como manifestar seu poder inato. Distribua +2 em um atributo e +1 em outro diferente.
      </p>

      <div className="origins-asi-options">
        {/* Opção A */}
        <div className={`origins-asi-option-row ${!asiAllPlus1 ? 'origins-asi-option-active' : ''}`}>
          <span className="origins-asi-option-label">Opção A</span>
          <div className="origins-asi-dropdowns">
            <div className="origins-asi-dropdown-group">
              <label className="origins-asi-dropdown-label-plus2">Bônus +2</label>
              <select
                className="origins-asi-select"
                value={asiPlus2 ?? ''}
                onChange={(e) => handleSelectPlus2(e.target.value || '')}
                onClick={() => onSetAllPlus1(false)}
              >
                <option value="">Selecionar Atributo</option>
                {availableForPlus2.map((attr) => (
                  <option key={attr} value={attr}>
                    {ATTR_LABELS[attr] ?? attr.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="origins-asi-dropdown-group">
              <label className="origins-asi-dropdown-label-plus1">Bônus +1</label>
              <select
                className="origins-asi-select"
                value={asiPlus1 ?? ''}
                onChange={(e) => handleSelectPlus1(e.target.value || '')}
                onClick={() => onSetAllPlus1(false)}
              >
                <option value="">Selecionar Atributo</option>
                {availableForPlus1.map((attr) => (
                  <option key={attr} value={attr}>
                    {ATTR_LABELS[attr] ?? attr.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="origins-asi-or-divider">
          <span className="origins-asi-or-text">ou</span>
        </div>

        {/* Opção B */}
        <button
          className={`origins-asi-option-b ${asiAllPlus1 ? 'origins-asi-option-b-selected' : ''}`}
          onClick={handleOptionB}
          type="button"
        >
          <span className="origins-asi-option-b-label">+1 / +1 / +1</span>
          <span className="origins-asi-option-b-desc">
            Distribui +1 igualmente nos 3 atributos elegíveis
          </span>
          {eligible.length > 0 && (
            <span className="origins-asi-eligible-list">
              {eligible.map((a) => ATTR_LABELS[a] ?? a.toUpperCase()).join(' / ')}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
