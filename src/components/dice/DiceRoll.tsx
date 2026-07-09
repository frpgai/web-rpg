import { useEffect } from 'react';
import { useDiceRollStore } from '../../stores/diceRollStore';
import { DiceGrid } from './DiceGrid';
import styles from './DiceRoll.module.css';

export function DiceRoll() {
  const {
    rollState,
    currentRoll,
    attackRoll,
    contextLabel,
    difficultyLabel,
    startRoll,
    onAnimationComplete,
  } = useDiceRollStore();

  // Orquestração automática das fases de revelação
  useEffect(() => {
    if (rollState === 'reveal_raw') {
      const t = setTimeout(() => {
        onAnimationComplete();
      }, 1200);
      return () => clearTimeout(t);
    }

    if (rollState === 'reveal_calculation') {
      const t = setTimeout(() => {
        onAnimationComplete();
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [rollState, onAnimationComplete]);

  // Se estiver ocioso, não renderiza nada
  if (rollState === 'idle') return null;

  // Determinar se aplica o efeito de brilho crítico
  const isCrit = currentRoll?.is_critical || (currentRoll?.sequence === 1 && currentRoll.is_critical);
  const cardClass = `${styles.diceCard} ${isCrit ? styles.critGlow : ''}`;

  // Se o estado for pending_roll, exibe a tela de clique para rolar
  if (rollState === 'pending_roll') {
    return (
      <div className={cardClass}>
        <div className={styles.header}>
          <span className={styles.contextLabel}>{contextLabel}</span>
          {difficultyLabel && (
            <span className={styles.subLabel}>Dificuldade: {difficultyLabel}</span>
          )}
        </div>
        <div className={styles.diceArea}>
          {/* Mostra um d20 estático antes de rolar */}
          <DiceGrid type="d20" rolls={[20]} rolling={false} rollType="normal" />
        </div>
        <button type="button" className={styles.pendingButton} onClick={startRoll}>
          Rolar Dados
        </button>
      </div>
    );
  }

  // Obter detalhes do rolo atual
  const diceType = currentRoll?.dice_type || 'd20';
  const rolls = currentRoll?.rolls || [10];
  const rollUsed = currentRoll?.roll_used || 10;
  const isRolling = rollState === 'rolling' || rollState === 'rolling_damage';
  const showRaw = rollState !== 'rolling' && rollState !== 'rolling_damage';
  const showCalc = rollState === 'reveal_calculation' || rollState === 'result';
  const showResult = rollState === 'result';

  // Renderizar o badge de desfecho
  const renderBadge = () => {
    if (!showResult || !currentRoll) return null;

    if (currentRoll.roll_context.startsWith('damage_roll')) {
      return (
        <div className={`${styles.badge} ${isCrit ? styles.critBadge : styles.successBadge}`}>
          Dano: {currentRoll.total}
        </div>
      );
    }

    if (currentRoll.is_fumble) {
      return <div className={`${styles.badge} ${styles.fumbleBadge}`}>Erro Crítico</div>;
    }
    if (currentRoll.is_critical) {
      return <div className={`${styles.badge} ${styles.critBadge}`}>Acerto Fatal</div>;
    }

    if (currentRoll.success === true) {
      return <div className={`${styles.badge} ${styles.successBadge}`}>Sucesso</div>;
    }
    if (currentRoll.success === false) {
      return <div className={`${styles.badge} ${styles.failBadge}`}>Falha</div>;
    }
    return null;
  };

  // Renderizar a matemática da rolagem
  const renderMath = () => {
    if (!showCalc || !currentRoll) return null;

    const hasModifier = currentRoll.modifier !== 0;
    const modifierText = currentRoll.modifier_label || (hasModifier ? `${currentRoll.modifier > 0 ? '+' : ''}${currentRoll.modifier}` : '');

    // Para rolagens de dano multi-dado
    if (currentRoll.rolls.length > 1) {
      const rollsSumStr = currentRoll.rolls.join(' + ');
      return (
        <div className={styles.mathArea}>
          <span className={styles.formula}>
            ({rollsSumStr}){hasModifier ? ` ${modifierText}` : ''}
          </span>
          <span className={styles.totalValue}>{currentRoll.total}</span>
        </div>
      );
    }

    // Para d20 com vantagem ou desvantagem
    if (currentRoll.roll_type !== 'normal' && currentRoll.rolls.length === 2) {
      const indexUsed = currentRoll.rolls.indexOf(currentRoll.roll_used);
      const discardedVal = currentRoll.rolls[indexUsed === 0 ? 1 : 0];
      return (
        <div className={styles.mathArea}>
          <span className={styles.formula}>
            {currentRoll.roll_used} <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>{discardedVal}</span>{hasModifier ? ` ${modifierText}` : ''}
          </span>
          <span className={styles.totalValue}>{currentRoll.total}</span>
        </div>
      );
    }

    // Para rolagem d20 comum
    return (
      <div className={styles.mathArea}>
        <span className={styles.formula}>
          {currentRoll.roll_used}{hasModifier ? ` ${modifierText}` : ''}
        </span>
        <span className={styles.totalValue}>{currentRoll.total}</span>
      </div>
    );
  };

  const isDamageStage = currentRoll?.sequence === 2 || rollState === 'rolling_damage';

  return (
    <div className={cardClass}>
      {/* Resumo compacto do ataque anterior no topo se estiver na fase de dano */}
      {isDamageStage && attackRoll && (
        <div className={styles.attackSummary}>
          <span className={styles.attackSummaryLabel}>Ataque:</span>
          <span className={styles.attackSummaryValue}>
            <span>{attackRoll.total}</span>
            {attackRoll.is_critical && (
              <span className={styles.subLabel} style={{ color: 'var(--color-gold)' }}>
                Crítico!
              </span>
            )}
          </span>
        </div>
      )}

      <div className={styles.header}>
        <span className={styles.contextLabel}>{contextLabel}</span>
        {isDamageStage ? (
          <span className={styles.subLabel} style={{ color: 'var(--color-secondary)' }}>
            Rolo de Dano {currentRoll?.is_critical ? '(Dados Dobrados)' : ''}
          </span>
        ) : (
          difficultyLabel && (
            <span className={styles.difficultyBadge}>{difficultyLabel}</span>
          )
        )}
      </div>

      <div className={styles.diceArea}>
        <DiceGrid
          type={diceType}
          rolls={rolls}
          rolling={isRolling}
          rollType={currentRoll?.roll_type || 'normal'}
          rollUsed={rollUsed}
        />
      </div>

      {showRaw && renderMath()}
      {renderBadge()}
    </div>
  );
}
