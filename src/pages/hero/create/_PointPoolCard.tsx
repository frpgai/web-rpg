import './_PointPoolCard.css';

interface Props {
  remaining: number;
}

export function PointPoolCard({ remaining }: Props) {
  return (
    <div className="point-pool-card">
      <div className="label">Pontos Disponíveis</div>
      <div className="value-row">
        <div className="value">{String(remaining).padStart(2, '0')}</div>
        <div className="restantes">RESTANTES</div>
      </div>
    </div>
  );
}
