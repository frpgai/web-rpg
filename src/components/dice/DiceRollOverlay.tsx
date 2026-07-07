import { useDiceRollStore } from '../../stores/diceRollStore';
import { DiceRoll } from './DiceRoll';
import styles from './DiceRollOverlay.module.css';

export function DiceRollOverlay() {
  const { rollState, showFallbackButton, triggerFallbackFetch, reset } = useDiceRollStore();

  if (rollState === 'idle') return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Só permite fechar clicando no fundo se já estiver exibindo o resultado final
    if (rollState === 'result' && e.target === e.currentTarget) {
      reset();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <DiceRoll />

      {showFallbackButton && (
        <div className={styles.fallbackContainer}>
          <span className={styles.fallbackText}>A conexão está lenta...</span>
          <button type="button" className={styles.fallbackButton} onClick={triggerFallbackFetch}>
            Ver Resultado
          </button>
        </div>
      )}

      {rollState === 'result' && (
        <span className={styles.closeHint}>Toque na tela para fechar</span>
      )}
    </div>
  );
}
