import './hero-creation.css';

interface Props {
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  backLabel?: string;
  nextLabel?: string;
}

export function CreationFooter({
  onBack,
  onNext,
  canNext,
  backLabel = 'Voltar',
  nextLabel = 'Avançar',
}: Props) {
  return (
    <div className="creation-footer">
      <button type="button" className="btn-back" onClick={onBack}>
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span className="btn-back-text">{backLabel}</span>
      </button>

      <button
        type="button"
        className={`btn-next ${!canNext ? 'btn-next-disabled' : ''}`}
        onClick={onNext}
        disabled={!canNext}
      >
        <span className="btn-next-text">{nextLabel}</span>
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </div>
  );
}
