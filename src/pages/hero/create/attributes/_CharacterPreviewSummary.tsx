import './_CharacterPreviewSummary.css';
import type { Ancestry, Background, CharacterClass, Vocation } from '../../../../types';

interface Props {
  ancestry: Ancestry;
  background: Background;
  characterClass: CharacterClass | Vocation;
  loading?: boolean;
}

export function CharacterPreviewSummary({ ancestry, background, characterClass, loading }: Props) {
  if (loading) {
    return <div className="attr-preview-skeleton" />;
  }

  const traitNames = (ancestry.traits || []).map((t: any) =>
    typeof t === 'string' ? t : t.name
  );

  const colorClasses = ['attr-trait-tertiary', 'attr-trait-primary', 'attr-trait-secondary'];

  return (
    <div className="attr-preview-card">
      <div className="attr-preview-row">
        <div className="attr-preview-col">
          <span className="attr-preview-label">Ancestralidade</span>
          <span className="attr-preview-value">{ancestry.name}</span>
        </div>
        <div className="attr-preview-divider-v" />
        <div className="attr-preview-col">
          <span className="attr-preview-label">Antecedente</span>
          <span className="attr-preview-value">{background.name}</span>
        </div>
        <div className="attr-preview-divider-v" />
        <div className="attr-preview-col">
          <span className="attr-preview-label">Vocação</span>
          <span className="attr-preview-value">{characterClass.name}</span>
        </div>
      </div>

      {traitNames.length > 0 && (
        <>
          <div className="attr-preview-divider-h" />
          <div className="attr-preview-traits">
            {traitNames.map((name: string, i: number) => (
              <span
                key={name}
                className={`attr-preview-trait-badge ${colorClasses[i % 3]}`}
              >
                {name.toUpperCase()}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
