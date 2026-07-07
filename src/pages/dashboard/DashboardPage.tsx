import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Spinner } from '../../components/ui/Spinner';
import { Text } from '../../components/ui/Text';
import { InitiativeBanner } from '../../components/dashboard/InitiativeBanner';
import { HeroCarousel } from '../../components/dashboard/HeroCarousel';
import { CampaignCard } from '../../components/dashboard/CampaignCard';
import { useDashboard } from '../../hooks/useDashboard';
import { colors, spacing } from '../../constants/theme';
import { SvgIcon } from '../../components/ui/SvgIcon';
import type { Hero } from '../../types';
import { useDiceRollStore } from '../../stores/diceRollStore';
import { DiceRollOverlay } from '../../components/dice/DiceRollOverlay';
import { apiClient } from '../../api/client';
import './DashboardPage.css';


// Mock stats (TODO: wire to API)
const MOCK_GOLD = '2.450';
const MOCK_SESSIONS = '14';

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { heroes, pendingTurn, campaigns, loading, error, reload } = useDashboard();

  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedHeroId, setSelectedHeroId] = useState('');
  const [testContext, setTestContext] = useState<'ability_check' | 'combat_attack' | 'saving_throw'>('ability_check');
  const [testDc, setTestDc] = useState('15');
  const [sessions, setSessions] = useState<any[]>([]);
  const [backendMode, setBackendMode] = useState<'offline' | 'real'>('offline');
  const [selectedSessionId, setSelectedSessionId] = useState('00000000-0000-0000-0000-000000000000');
  const [customSessionId, setCustomSessionId] = useState('');

  useEffect(() => {
    if (showTestModal) {
      apiClient.get('api/v1/sessions').json<any[]>()
        .then((list) => {
          setSessions(list || []);
          if (list && list.length > 0) {
            setSelectedSessionId(list[0].id);
          } else {
            setSelectedSessionId('00000000-0000-0000-0000-000000000000');
          }
        })
        .catch((err) => {
          console.error('Failed to load sessions for test:', err);
          setSelectedSessionId('00000000-0000-0000-0000-000000000000');
        });
    }
  }, [showTestModal]);

  const triggerTestRoll = useDiceRollStore((s) => s.triggerRollRequest);

  const handleRunTestRoll = () => {
    const heroId = selectedHeroId || (heroes[0]?.id ?? 'test-hero');
    const sessionId = backendMode === 'real' ? (selectedSessionId === 'custom' ? customSessionId : selectedSessionId) : 'test';

    if (backendMode === 'real' && !sessionId) {
      alert('Por favor, informe ou selecione o ID da Sessão.');
      return;
    }

    triggerTestRoll(
      sessionId,
      {
        context_type: testContext === 'ability_check' ? 'npc_dialogue_option' : testContext,
        context_id: 'test-context-id',
        hero_id: heroId,
      },
      testContext === 'combat_attack' ? 'Ataque com Espada Grande' : testContext === 'saving_throw' ? 'Teste de Salvaguarda' : 'Teste de Perícia',
      testContext === 'combat_attack' ? null : `CD ${testDc}`
    );
    setShowTestModal(false);
  };

  const handlePendingTurnPress = () => {
    if (pendingTurn?.next) {
      setLocation(`/campaigns/${pendingTurn.next.campaign_id}`);
    }
  };

  const handleHeroPress = (hero: Hero) => {
    setLocation(`/app/hero/${hero.id}`);
  };

  const handleCreateHero = () => {
    setLocation('/app/hero/create/origins');
  };

  const handleCreateSession = () => {
    setLocation('/app/sessions/create/select-campaign');
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
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center' }}>
          <button
            className="header-icon"
            aria-label="test-roll"
            onClick={() => setShowTestModal(true)}
            style={{ marginRight: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <span className="material-icons" style={{ color: colors.primary, fontSize: 22 }}>casino</span>
          </button>
          <button className="header-icon" aria-label="menu" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <SvgIcon name="sword-cross" size={22} color={colors.onSurfaceVariant} />
          </button>
        </div>
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

      {/* FAB */}
      <button className="fab" onClick={handleCreateSession} aria-label="Criar Sessão">
        <i className="material-icons" style={{ color: '#411478', fontSize: 28 }}>add</i>
      </button>

      {/* Modal de Testes */}
      {showTestModal && (
        <div className="test-roll-modal-backdrop" onClick={() => setShowTestModal(false)}>
          <div className="test-roll-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Testar Rolagem de Dados</h3>
            
            <div className="form-group">
              <label className="form-label">Modo da Rolagem</label>
              <select className="form-select" value={backendMode} onChange={(e) => setBackendMode(e.target.value as any)}>
                <option value="offline">Simulação Local (Offline / Mock)</option>
                <option value="real">Backend Real (HTTP + WebSockets)</option>
              </select>
            </div>

            {backendMode === 'real' && (
              <div className="form-group">
                <label className="form-label">Sessão de Jogo</label>
                <select className="form-select" value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)}>
                  <option value="00000000-0000-0000-0000-000000000000">Sessão Sandbox/Teste (Sem Banco)</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name || `Sessão ${s.id.slice(0, 8)}`}</option>
                  ))}
                  <option value="custom">Digitar ID customizado...</option>
                </select>
              </div>
            )}

            {backendMode === 'real' && selectedSessionId === 'custom' && (
              <div className="form-group">
                <label className="form-label">ID da Sessão (UUID)</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={customSessionId}
                  onChange={(e) => setCustomSessionId(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Selecione o Herói</label>
              <select className="form-select" value={selectedHeroId} onChange={(e) => setSelectedHeroId(e.target.value)}>
                {heroes.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
                {heroes.length === 0 && <option value="test-hero">Herói de Teste</option>}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Teste</label>
              <select className="form-select" value={testContext} onChange={(e) => setTestContext(e.target.value as any)}>
                <option value="ability_check">Teste de Perícia (Atributo)</option>
                <option value="combat_attack">Ataque Físico (Ataque + Dano)</option>
                <option value="saving_throw">Teste de Salvaguarda</option>
              </select>
            </div>

            {testContext !== 'combat_attack' && (
              <div className="form-group">
                <label className="form-label">Classe de Dificuldade (CD)</label>
                <input className="form-input" type="number" value={testDc} onChange={(e) => setTestDc(e.target.value)} />
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowTestModal(false)}>Cancelar</button>
              <button className="btn-confirm" onClick={handleRunTestRoll}>Rolar dados</button>
            </div>
          </div>
        </div>
      )}

      <DiceRollOverlay />
    </div>
  );
}
