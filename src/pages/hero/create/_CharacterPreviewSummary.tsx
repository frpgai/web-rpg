import type { Ancestry, Background, CharacterClass, Vocation } from '../../../types';

interface Props {
  ancestry: Ancestry;
  background: Background;
  characterClass: CharacterClass | Vocation;
}

export function CharacterPreviewSummary({ ancestry, background, characterClass }: Props) {
  // Extract trait names. Ancestry traits in the new schema might be objects or strings.
  const traitNames = (ancestry.traits || []).map((t: any) => typeof t === 'string' ? t : t.name);

  return (
    <div className="char-preview-summary-card">
      <div className="char-preview-summary-row">
        <div className="char-preview-summary-col">
          <span className="char-preview-summary-label">Ancestralidade</span>
          <span className="char-preview-summary-value">{ancestry.name}</span>
        </div>
        <div className="char-preview-summary-divider-v" />
        <div className="char-preview-summary-col">
          <span className="char-preview-summary-label">Antecedente</span>
          <span className="char-preview-summary-value">{background.name}</span>
        </div>
        <div className="char-preview-summary-divider-v" />
        <div className="char-preview-summary-col">
          <span className="char-preview-summary-label">Vocação</span>
          <span className="char-preview-summary-value">{characterClass.name}</span>
        </div>
      </div>

      <div className="char-preview-summary-divider-h" />

      <div className="char-preview-summary-trait-badges">
        {traitNames.map((traitName: string, i: number) => {
          const classes = ['trait-tertiary', 'trait-primary', 'trait-secondary'];
          const colorClass = classes[i % 3];
          return (
            <div key={traitName} className={`char-preview-summary-trait-badge ${colorClass}`}>
              <span className="char-preview-summary-trait-badge-text">
                {traitName.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
