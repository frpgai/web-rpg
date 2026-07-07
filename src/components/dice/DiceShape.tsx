import { useEffect, useState } from 'react';
import type { DiceType } from '../../../types/diceRoll';
import styles from './DiceShape.module.css';

interface DiceShapeProps {
  type: DiceType;
  value: number;
  rolling: boolean;
  discarded?: boolean;
  size?: number;
}

const DICE_FACES: Record<DiceType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
};

export function DiceShape({ type, value, rolling, discarded = false, size = 64 }: DiceShapeProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const maxFaces = DICE_FACES[type] || 20;

  useEffect(() => {
    if (!rolling) {
      setDisplayValue(value);
      return;
    }

    const interval = setInterval(() => {
      const randomFace = Math.floor(Math.random() * maxFaces) + 1;
      setDisplayValue(randomFace);
    }, 80);

    return () => clearInterval(interval);
  }, [rolling, value, maxFaces]);

  const renderSvg = () => {
    switch (type) {
      case 'd4':
        return (
          <svg className={styles.svgIcon} viewBox="0 0 100 100" fill="none">
            <polygon
              points="50,15 90,85 10,85"
              stroke="var(--color-gold)"
              strokeWidth="3"
              fill="var(--color-surface-low)"
            />
            <line x1="50" y1="15" x2="50" y2="85" stroke="var(--color-gold)" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="10" y1="85" x2="50" y2="50" stroke="var(--color-gold)" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="90" y1="85" x2="50" y2="50" stroke="var(--color-gold)" strokeWidth="1.5" strokeDasharray="3 3" />
          </svg>
        );
      case 'd6':
        return (
          <svg className={styles.svgIcon} viewBox="0 0 100 100" fill="none">
            <path
              d="M50,10 L90,30 L90,70 L50,90 L10,70 L10,30 Z"
              stroke="var(--color-gold)"
              strokeWidth="3"
              fill="var(--color-surface-low)"
            />
            <path d="M50,10 L50,90 M50,50 L90,30 M50,50 L10,30" stroke="var(--color-gold)" strokeWidth="1.5" />
          </svg>
        );
      case 'd8':
        return (
          <svg className={styles.svgIcon} viewBox="0 0 100 100" fill="none">
            <polygon
              points="50,5 95,50 50,95 5,50"
              stroke="var(--color-gold)"
              strokeWidth="3"
              fill="var(--color-surface-low)"
            />
            <line x1="5" y1="50" x2="95" y2="50" stroke="var(--color-gold)" strokeWidth="1.5" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="var(--color-gold)" strokeWidth="1.5" />
            <line x1="5" y1="50" x2="50" y2="5" stroke="var(--color-gold)" strokeWidth="1" />
            <line x1="95" y1="50" x2="50" y2="5" stroke="var(--color-gold)" strokeWidth="1" />
          </svg>
        );
      case 'd10':
        return (
          <svg className={styles.svgIcon} viewBox="0 0 100 100" fill="none">
            <polygon
              points="50,5 90,35 90,65 50,95 10,65 10,35"
              stroke="var(--color-gold)"
              strokeWidth="3"
              fill="var(--color-surface-low)"
            />
            <line x1="50" y1="5" x2="50" y2="95" stroke="var(--color-gold)" strokeWidth="1.5" />
            <line x1="10" y1="35" x2="90" y2="65" stroke="var(--color-gold)" strokeWidth="1.5" />
            <line x1="10" y1="65" x2="90" y2="35" stroke="var(--color-gold)" strokeWidth="1.5" />
          </svg>
        );
      case 'd12':
        return (
          <svg className={styles.svgIcon} viewBox="0 0 100 100" fill="none">
            <polygon
              points="50,5 92,36 76,86 24,86 8,36"
              stroke="var(--color-gold)"
              strokeWidth="3"
              fill="var(--color-surface-low)"
            />
            <polygon points="50,30 73,47 64,74 36,74 27,47" stroke="var(--color-gold)" strokeWidth="1.5" fill="none" />
            <line x1="50" y1="5" x2="50" y2="30" stroke="var(--color-gold)" strokeWidth="1.5" />
            <line x1="92" y1="36" x2="73" y2="47" stroke="var(--color-gold)" strokeWidth="1.5" />
            <line x1="76" y1="86" x2="64" y2="74" stroke="var(--color-gold)" strokeWidth="1.5" />
            <line x1="24" y1="86" x2="36" y2="74" stroke="var(--color-gold)" strokeWidth="1.5" />
            <line x1="8" y1="36" x2="27" y2="47" stroke="var(--color-gold)" strokeWidth="1.5" />
          </svg>
        );
      case 'd20':
      default:
        return (
          <svg className={styles.svgIcon} viewBox="0 0 100 100" fill="none">
            <polygon
              points="50,5 95,30 95,75 50,95 5,75 5,30"
              stroke="var(--color-gold)"
              strokeWidth="3"
              fill="var(--color-surface-low)"
            />
            <polygon points="50,30 80,65 20,65" stroke="var(--color-gold)" strokeWidth="1.5" fill="none" />
            <line x1="50" y1="5" x2="50" y2="30" stroke="var(--color-gold)" strokeWidth="1.5" />
            <line x1="95" y1="30" x2="80" y2="65" stroke="var(--color-gold)" strokeWidth="1.5" />
            <line x1="5" y1="30" x2="20" y2="65" stroke="var(--color-gold)" strokeWidth="1.5" />
            <line x1="95" y1="75" x2="80" y2="65" stroke="var(--color-gold)" strokeWidth="1.5" />
            <line x1="5" y1="75" x2="20" y2="65" stroke="var(--color-gold)" strokeWidth="1.5" />
            <line x1="50" y1="95" x2="50" y2="65" stroke="var(--color-gold)" strokeWidth="1.5" />
          </svg>
        );
    }
  };

  const wrapperClass = `${styles.wrapper} ${discarded ? styles.discarded : ''}`;
  const dieClass = `${styles.die} ${rolling ? styles.rolling : styles.settling}`;
  const fontSize = size * 0.43; // Proporcional ao tamanho do dado

  return (
    <div className={wrapperClass} style={{ width: size, height: size }}>
      <div className={dieClass}>
        {renderSvg()}
        <span
          className={`${styles.numberOverlay} ${styles[`number_${type}`]}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {displayValue}
        </span>
      </div>
    </div>
  );
}
