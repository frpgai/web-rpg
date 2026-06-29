import { useParams, useLocation } from 'wouter';
import { useHero } from './useHero';
import { HeroAvatar } from './components/HeroAvatar';
import { HeroIdentity } from './components/HeroIdentity';
import { HeroStatusBars } from './components/HeroStatusBars';
import { HeroAttributeGrid } from './components/HeroAttributeGrid';
import { HeroInventory } from './components/HeroInventory';
import { HeroSkills } from './components/HeroSkills';
import { HeroTabs } from './components/HeroTabs';
import './HeroDetailPage.css';

function HeroDetailSkeleton() {
  return (
    <>
      <div className="hd-skeleton-header">
        <div className="hd-skeleton-avatar" />
        <div className="hd-skeleton-identity">
          <div className="hd-skeleton-line hd-skeleton-line--lg" />
          <div className="hd-skeleton-line hd-skeleton-line--md" />
          <div className="hd-skeleton-line hd-skeleton-line--sm" />
        </div>
      </div>
      <div className="hd-skeleton-bars">
        <div className="hd-skeleton-bar" />
        <div className="hd-skeleton-bar" />
        <div className="hd-skeleton-bar" />
      </div>
      <div className="hd-skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="hd-skeleton-card" />
        ))}
      </div>
    </>
  );
}

function HeroDetailError({
  message,
  buttonLabel,
  onAction,
}: {
  message: string;
  buttonLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="hd-error-page">
      <span className="material-symbols-outlined hd-error-icon">sentiment_dissatisfied</span>
      <p className="hd-error-title">{message}</p>
      <button className="hd-error-btn" onClick={onAction}>{buttonLabel}</button>
    </div>
  );
}

export default function HeroDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const heroId = params?.id ?? '';

  const { hero, loading, error, errorStatus, refresh } = useHero(heroId);

  if (loading) return <HeroDetailSkeleton />;

  if (errorStatus === 404 || (!hero && error)) {
    return (
      <HeroDetailError
        message={
          errorStatus === 404 ? 'Herói não encontrado'
          : errorStatus === 403 ? 'Você não tem acesso a este herói'
          : (error ?? 'Erro desconhecido')
        }
        buttonLabel={
          errorStatus === 403 ? 'Voltar'
          : errorStatus === 404 ? 'Voltar ao Dashboard'
          : 'Tentar novamente'
        }
        onAction={() => {
          if (errorStatus === 403) setLocation(-1 as unknown as string);
          else if (errorStatus === 404) setLocation('/dashboard');
          else refresh();
        }}
      />
    );
  }

  if (!hero) return null;

  return (
    <>
      <div className="hd-header">
        <HeroAvatar hero={hero} />
        <div className="hd-identity">
          <HeroIdentity hero={hero} />
          <HeroStatusBars hero={hero} />
        </div>
      </div>

      <HeroAttributeGrid hero={hero} />

      <div className="hd-main-layout">
        <div className="hd-left-col">
          <HeroInventory items={hero.inventory ?? []} />
          <HeroSkills hero={hero} />
        </div>
        <HeroTabs hero={hero} />
      </div>
    </>
  );
}
