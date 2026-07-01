import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Toast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { useCampaignSelection } from '../../hooks/useCampaignSelection';
import { CampaignDetailSheet } from './CampaignDetailSheet';
import type { CampaignListItem } from '../../types';
import './CreateSessionPage.css';

const COMING_SOON_MESSAGE = 'Em breve — funcionalidade ainda não disponível';

function levelRangeLabel(item: CampaignListItem): string {
  return `Níveis ${item.level_start} a ${item.level_end}`;
}

export default function CreateSessionPage() {
  const [, setLocation] = useLocation();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<CampaignListItem | null>(null);
  const {
    search,
    setSearch,
    levelMin,
    setLevelMin,
    levelMax,
    setLevelMax,
    tags,
    selectedTags,
    toggleTag,
    campaigns,
    loading,
    loadingMore,
    error,
    loadMore,
  } = useCampaignSelection();

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const showComingSoonToast = useCallback(() => {
    setToastMessage(COMING_SOON_MESSAGE);
  }, []);

  const handleBack = () => setLocation('/app/dashboard');

  const handleSelectCampaign = useCallback(
    (_campaign: CampaignListItem) => {
      setDetailCampaign(null);
      showComingSoonToast();
    },
    [showComingSoonToast]
  );

  return (
    <div className="create-session-root">
      <header className="create-session-header">
        <button className="create-session-back" onClick={handleBack} aria-label="Voltar">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="create-session-title">Criar Nova Sessão</h1>
        <div className="create-session-header-spacer" />
      </header>

      <main className="create-session-main">
        <section className="create-session-filters">
          <div className="create-session-search">
            <span className="material-symbols-outlined create-session-search-icon">search</span>
            <input
              className="create-session-search-input"
              type="text"
              placeholder="Buscar campanha pelo título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="create-session-level-fields">
            <label className="create-session-level-field">
              <span className="create-session-level-label">Nível Mín</span>
              <input
                className="create-session-level-input"
                type="number"
                min={1}
                value={levelMin ?? ''}
                onChange={(e) => setLevelMin(e.target.value === '' ? null : Number(e.target.value))}
              />
            </label>
            <label className="create-session-level-field">
              <span className="create-session-level-label">Nível Máx</span>
              <input
                className="create-session-level-input"
                type="number"
                min={1}
                value={levelMax ?? ''}
                onChange={(e) => setLevelMax(e.target.value === '' ? null : Number(e.target.value))}
              />
            </label>
          </div>

          {tags.length > 0 && (
            <div className="create-session-chips">
              {tags.map((tag) => {
                const active = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={`create-session-chip ${active ? 'create-session-chip-active' : ''}`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="create-session-list-section">
          <div className="create-session-list-header">
            <span className="create-session-list-title">Campanhas Disponíveis</span>
            <span className="create-session-list-count">{campaigns.length} RESULTADOS</span>
          </div>

          {loading && campaigns.length === 0 ? (
            <div className="create-session-centered">
              <Spinner color="var(--color-primary)" size="large" />
            </div>
          ) : error && campaigns.length === 0 ? (
            <div className="create-session-centered">
              <span className="create-session-error-text">{error}</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="create-session-centered">
              <span className="create-session-empty-text">Nenhuma campanha encontrada.</span>
            </div>
          ) : (
            <ul className="create-session-list">
              {campaigns.map((campaign) => (
                <li key={campaign.id} className="create-session-row">
                  <div className="create-session-row-thumb">
                    {campaign.cover_image_url ? (
                      <img src={campaign.cover_image_url} alt={campaign.title} />
                    ) : (
                      <div className="create-session-row-thumb-fallback" />
                    )}
                  </div>

                  <div className="create-session-row-content">
                    <h3 className="create-session-row-title">{campaign.title}</h3>
                    <p className="create-session-row-level">{levelRangeLabel(campaign)}</p>

                    {campaign.tags.length > 0 && (
                      <div className="create-session-row-tags">
                        {campaign.tags.map((tag) => (
                          <span key={tag.id} className="create-session-row-tag">{tag.name}</span>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      className="create-session-row-details"
                      onClick={() => setDetailCampaign(campaign)}
                    >
                      <span className="material-symbols-outlined create-session-row-details-icon">info</span>
                      Ver Detalhes
                    </button>
                  </div>

                  <button
                    type="button"
                    className="create-session-row-select"
                    aria-label="Selecionar campanha"
                    onClick={showComingSoonToast}
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div ref={sentinelRef} className="create-session-sentinel" />
          {loadingMore && (
            <div className="create-session-loading-more">
              <Spinner color="var(--color-primary)" size="small" />
            </div>
          )}
        </section>
      </main>

      <footer className="create-session-footer">
        <button type="button" className="create-session-cancel" onClick={handleBack}>
          <span className="material-symbols-outlined create-session-cancel-icon">close</span>
          Cancelar e voltar ao início
        </button>
      </footer>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />

      <CampaignDetailSheet
        campaign={detailCampaign}
        onClose={() => setDetailCampaign(null)}
        onSelectCampaign={handleSelectCampaign}
      />
    </div>
  );
}
