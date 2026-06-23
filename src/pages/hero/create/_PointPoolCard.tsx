import './_PointPoolCard.css';

interface Props {
  remaining: number;
  budget: number;
  bonusDescription?: string; // e.g. "+2 / +1"
}

export function PointPoolCard({ remaining, budget, bonusDescription }: Props) {
  const isExhausted = remaining === 0;
  const isOverspent = remaining < 0;

  return (
    <div className={`attr-pool-card ${isExhausted ? 'attr-pool-card--done' : ''} ${isOverspent ? 'attr-pool-card--error' : ''}`}>
      <span className="attr-pool-label">PONTOS DISPONÍVEIS</span>

      <div className="attr-pool-value-row">
        <span className={`attr-pool-value ${isOverspent ? 'attr-pool-value--error' : ''}`}>
          {remaining}
        </span>
        <span className="attr-pool-unit">/ {budget}</span>
      </div>

      {bonusDescription && (
        <span className="attr-pool-bonus-badge">
          BÔNUS DO ANTECEDENTE: {bonusDescription}
        </span>
      )}

      <p className="attr-pool-hint">
        Os bônus de antecedente serão aplicados automaticamente nos atributos elegíveis.
      </p>
    </div>
  );
}
