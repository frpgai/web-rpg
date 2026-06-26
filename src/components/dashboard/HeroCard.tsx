import type { Hero } from '../../types';
import { getAssetUrl } from '../../utils/url';
import './HeroCard.css';


export interface HeroCardProps {
  readonly hero?: Hero;
  readonly variant?: 'normal' | 'skeleton' | 'new-hero';
  readonly showPendingBadge?: boolean;
  readonly cardWidth?: number;
  readonly onPress?: () => void;
}

function SkeletonCard({ cardWidth }: { cardWidth: number }) {
  return (
    <div className="dashboard-hero-card dashboard-hero-card-skeleton" style={{ width: cardWidth }}>
      <div className="dashboard-hero-card-header">
        <div className="dashboard-hero-card-skeleton-avatar" />
        <div className="dashboard-hero-card-info">
          <div className="dashboard-hero-card-skeleton-name" />
          <div className="dashboard-hero-card-skeleton-class" />
        </div>
      </div>
      <div className="dashboard-hero-card-skeleton-bar" />
      <div className="dashboard-hero-card-skeleton-bar" />
    </div>
  );
}

function NewHeroCard({ cardWidth, onPress }: { cardWidth: number; onPress?: () => void }) {
  return (
    <button
      className="dashboard-hero-card dashboard-hero-card-new"
      style={{ width: cardWidth }}
      onClick={onPress}
      type="button"
      aria-label="Criar novo herói"
    >
      <div className="dashboard-hero-card-energy-pulse" />
      <div className="dashboard-hero-card-new-content">
        <div className="dashboard-hero-card-new-icon-wrapper">
          <i className="material-icons" style={{ fontSize: 32, color: '#d7baff' }}>person_add</i>
        </div>
        <span className="dashboard-hero-card-new-label">CRIAR HERÓI</span>
      </div>
    </button>
  );
}

export function HeroCard({
  hero,
  variant = 'normal',
  showPendingBadge = false,
  cardWidth = 280,
  onPress,
}: HeroCardProps) {
  if (variant === 'skeleton' || (variant === 'normal' && !hero)) {
    return <SkeletonCard cardWidth={cardWidth} />;
  }

  if (variant === 'new-hero') {
    return <NewHeroCard cardWidth={cardWidth} onPress={onPress} />;
  }

  const currentHero = hero!;
  const hpPct = currentHero.hp_max > 0 ? Math.min(Math.max(currentHero.hp_current / currentHero.hp_max, 0), 1) : 0;
  const xpPct = currentHero.xp_next_level > 0 ? Math.min(Math.max(currentHero.xp / currentHero.xp_next_level, 0), 1) : 0;

  // Visual health bar color rule from spec (A00110): verde (>50%) -> amarelo (25–50%) -> vermelho (<25%)
  let hpColor = '#31e368'; // Green
  if (hpPct < 0.25) {
    hpColor = '#dc2626'; // Red
  } else if (hpPct <= 0.50) {
    hpColor = '#ffb86c'; // Yellow/Orange
  }

  return (
    <div
      className="dashboard-hero-card"
      style={{ width: cardWidth }}
      onClick={onPress}
      role="button"
      tabIndex={0}
      aria-label={`Herói ${currentHero.name}, nível ${currentHero.level}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onPress?.();
        }
      }}
    >
      {/* Avatar row */}
      <div className="dashboard-hero-card-header">
        <div className="dashboard-hero-card-avatar-wrapper">
          {currentHero.avatar_url ? (
            <img
              src={getAssetUrl(currentHero.avatar_url)}
              alt={currentHero.name}
              className="dashboard-hero-card-avatar"
            />
          ) : (
            <div className="dashboard-hero-card-avatar-fallback">
              <span className="dashboard-hero-card-avatar-letter">
                {currentHero.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <div className="dashboard-hero-card-level-badge">
            <span className="dashboard-hero-card-level-text">LVL {currentHero.level}</span>
          </div>

          {(currentHero.pending_turn || showPendingBadge) && (
            <div className="dashboard-hero-card-turn-dot" />
          )}
        </div>

        <div className="dashboard-hero-card-info">
          <span className="dashboard-hero-card-name">{currentHero.name}</span>
          <span className="dashboard-hero-card-class">{currentHero.class}</span>
        </div>
      </div>

      {/* HP and XP bars */}
      <div className="dashboard-hero-card-bars">
        {/* HP Bar */}
        <div className="dashboard-hero-card-bar-row">
          <div className="dashboard-hero-card-bar-labels">
            <span className="dashboard-hero-card-bar-label">SAÚDE</span>
            <span className="dashboard-hero-card-bar-label">
              {currentHero.hp_current} / {currentHero.hp_max}
            </span>
          </div>
          <div className="dashboard-hero-card-bar-track">
            <div
              className="dashboard-hero-card-bar-fill"
              style={{
                width: `${hpPct * 100}%`,
                backgroundColor: hpColor,
              }}
            />
          </div>
        </div>

        {/* XP Bar */}
        <div className="dashboard-hero-card-bar-row">
          <div className="dashboard-hero-card-bar-labels">
            <span className="dashboard-hero-card-bar-label">XP</span>
            <span className="dashboard-hero-card-bar-label">
              {currentHero.xp} / {currentHero.xp_next_level} XP
            </span>
          </div>
          <div className="dashboard-hero-card-bar-track">
            <div
              className="dashboard-hero-card-bar-fill dashboard-hero-card-bar-fill-xp"
              style={{ width: `${xpPct * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
