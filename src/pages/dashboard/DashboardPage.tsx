import { useLocation } from 'wouter';
import { Spinner } from '../../components/ui/Spinner';
import { Text } from '../../components/ui/Text';
import { InitiativeBanner } from '../../components/dashboard/InitiativeBanner';
import { HeroCarousel } from '../../components/dashboard/HeroCarousel';
import { CampaignCard } from '../../components/dashboard/CampaignCard';
import { BottomNav } from '../../components/navigation/BottomNav';
import { useDashboard } from '../../hooks/useDashboard';
import { colors, spacing } from '../../constants/theme';
import { SvgIcon } from '../../components/ui/SvgIcon';
import type { Hero } from '../../types';
import './DashboardPage.css';


// Mock stats (TODO: wire to API)
const MOCK_GOLD = '2.450';
const MOCK_SESSIONS = '14';

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { heroes, pendingTurn, campaigns, loading, error, reload } = useDashboard();

  const handlePendingTurnPress = () => {
    if (pendingTurn?.next) {
      setLocation(`/campaigns/${pendingTurn.next.campaign_id}`);
    }
  };

  const handleHeroPress = (hero: Hero) => {
    setLocation(`/hero/${hero.id}`);
  };

  const handleCreateHero = () => {
    setLocation('/hero/create/origins');
  };

  const handleCampaignPress = (id: string) => {
    setLocation(`/campaigns/${id}`);
  };

  const handleSeeAllCampaigns = () => {
    setLocation('/campaigns');
  };

  const activeCampaign = pendingTurn?.next
    ? campaigns.find((c) => c.id === pendingTurn.next?.campaign_id) ?? null
    : null;

  if (loading) {
    return (
      <div className="dashboard-centered">
        <Spinner color={colors.primary} size="large" />
        <Text className="loading-text">Carregando...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-centered">
        <Text className="error-text">{error}</Text>
        <button className="retry-button" onClick={reload}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <SvgIcon name="book-open-page-variant" size={22} color={colors.primary} />
          <span className="logo">BARD</span>
        </div>
        <button className="header-icon" aria-label="menu">
          <SvgIcon name="sword-cross" size={22} color={colors.onSurfaceVariant} />
        </button>
      </header>

      <div className="dashboard-scroll">
        {/* Initiative Banner */}
        {pendingTurn && pendingTurn.total > 0 && pendingTurn.next && (
          <InitiativeBanner data={pendingTurn} onPress={handlePendingTurnPress} />
        )}

        {/* Section: Meus Heróis */}
        <div className="section-header">
          <i className="material-icons" style={{ color: colors.primary, fontSize: 16 }}>account_circle</i>
          <span className="section-title">Meus Heróis</span>
        </div>
        <HeroCarousel heroes={heroes} onHeroPress={handleHeroPress} onCreateHero={handleCreateHero} />

        {/* Stats grid */}
        {heroes.length > 0 && (
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">OURO</span>
              <span className="stat-value" style={{ color: colors.secondary }}>{MOCK_GOLD}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">SESSÕES</span>
              <span className="stat-value" style={{ color: colors.tertiary }}>{MOCK_SESSIONS}</span>
            </div>
          </div>
        )}

        {/* Active campaign */}
        {activeCampaign && (
          <section className="active-campaign-section">
            <span className="section-title-inline">Campanha Ativa</span>
            <CampaignCard campaign={activeCampaign} onPress={() => handleCampaignPress(activeCampaign.id)} active />
          </section>
        )}

        {/* Explore Campaigns */}
        <div className="section-header explore-header">
          <i className="material-icons" style={{ color: colors.secondary, fontSize: 16 }}>explore</i>
          <span className="section-title" style={{ flex: 1 }}>Explorar Campanhas</span>
          <button className="see-all-button" onClick={handleSeeAllCampaigns}>Ver Todas</button>
        </div>

        {campaigns.length === 0 ? (
          <div className="empty-campaigns">
            <span className="empty-text">Nenhuma campanha disponível no momento</span>
          </div>
        ) : (
          <div className="campaigns-list" style={{ display: 'flex', overflowX: 'auto', gap: spacing.md, padding: spacing.md }}>
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} onPress={() => handleCampaignPress(c.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <BottomNav active="home" onPress={() => {}} />

      {/* FAB */}
      <button className="fab" onClick={handleCreateHero} aria-label="Criar Herói">
        <i className="material-icons" style={{ color: '#411478', fontSize: 28 }}>add</i>
      </button>
    </div>
  );
}
