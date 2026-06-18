import { HeroCard } from './HeroCard';
import type { Hero } from '../../types';
import './HeroCarousel.css';


type Props = {
  heroes: Hero[];
  onHeroPress: (hero: Hero) => void;
  onCreateHero: () => void;
  isLoading?: boolean;
};

const SKELETON_COUNT = 3;

export function HeroCarousel({ heroes, onHeroPress, onCreateHero, isLoading = false }: Props) {
  if (isLoading) {
    return (
      <div className="dashboard-hero-carousel-row">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <HeroCard key={`skeleton-${i}`} variant="skeleton" />
        ))}
      </div>
    );
  }

  type Item = { type: 'hero'; hero: Hero } | { type: 'new-hero' };

  const data: Item[] = [
    ...heroes.map((hero): Item => ({ type: 'hero', hero })),
    { type: 'new-hero' },
  ];

  return (
    <div className="dashboard-hero-carousel-container">
      <div className="dashboard-hero-carousel-scroll">
        {data.map((item) => {
          if (item.type === 'new-hero') {
            return (
              <HeroCard
                key="new-hero"
                variant="new-hero"
                onPress={onCreateHero}
              />
            );
          }
          return (
            <HeroCard
              key={item.hero.id}
              hero={item.hero}
              variant="normal"
              showPendingBadge={item.hero.pending_turn}
              onPress={() => onHeroPress(item.hero)}
            />
          );
        })}
      </div>
    </div>
  );
}
