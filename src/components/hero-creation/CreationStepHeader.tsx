import './hero-creation.css';

interface Props {
  stepLabel: string;      // e.g. "ETAPA 4: REVISÃO FINAL"
  headline: string;       // e.g. "DESTINO SELADO"
  progressLabel?: string; // unused — kept for API compat
  progressPct: number;    // 0–100
}

export function CreationStepHeader({ stepLabel, headline, progressPct }: Props) {
  return (
    <div className="creation-step-header">
      {/* Headline — Playfair Display, primary glow */}
      <h1 className="creation-step-headline">{headline}</h1>

      {/* Progress bar */}
      <div className="creation-progress-bar-bg">
        <div 
          className="creation-progress-bar-fill" 
          style={{ width: `${progressPct}%` }} 
        />
      </div>

      {/* Step label below bar */}
      <span className="creation-step-label">{stepLabel}</span>
    </div>
  );
}
