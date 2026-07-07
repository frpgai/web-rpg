import { useEffect, useState } from 'react';
import type { DiceType, RollType } from '../../../types/diceRoll';
import { DiceShape } from './DiceShape';
import styles from './DiceGrid.module.css';

interface DiceGridProps {
  type: DiceType;
  rolls: number[];
  rolling: boolean;
  rollType: RollType;
  rollUsed?: number;
}

export function DiceGrid({ type, rolls, rolling, rollType, rollUsed }: DiceGridProps) {
  const [delays, setDelays] = useState<number[]>([]);

  useEffect(() => {
    // Gera delays randômicos de 0-150ms para que os dados não rolem exatamente iguais
    const newDelays = rolls.map(() => Math.floor(Math.random() * 150));
    setDelays(newDelays);
  }, [rolls.length]);

  const isAdvDisadv = rollType === 'advantage' || rollType === 'disadvantage';
  const diceSize = rolls.length >= 5 ? 48 : 64;

  // Determinar qual dado foi descartado no fluxo de vantagem/desvantagem
  let usedIndex = -1;
  if (isAdvDisadv && rolls.length === 2 && rollUsed !== undefined) {
    usedIndex = rolls.indexOf(rollUsed);
    if (usedIndex === -1) {
      // Fallback
      usedIndex = rollType === 'advantage'
        ? (rolls[0] >= rolls[1] ? 0 : 1)
        : (rolls[0] <= rolls[1] ? 0 : 1);
    }
  }

  const gridClass = `${styles.grid} ${rolls.length >= 5 ? styles.grid5Plus : ''}`;

  return (
    <div className={gridClass}>
      {rolls.map((val, idx) => {
        const discarded = isAdvDisadv && idx !== usedIndex;
        const delay = delays[idx] || 0;

        return (
          <div
            key={idx}
            className={styles.dieWrapper}
            style={rolling ? { animationDelay: `${delay}ms` } : undefined}
          >
            <DiceShape
              type={type}
              value={val}
              rolling={rolling}
              discarded={discarded}
              size={diceSize}
            />
          </div>
        );
      })}
    </div>
  );
}
