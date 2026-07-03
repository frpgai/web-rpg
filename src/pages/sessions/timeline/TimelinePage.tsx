import { useEffect, useRef, useState } from 'react';
import { useParams } from 'wouter';
import { Spinner } from '../../../components/ui/Spinner';
import { getAssetUrl } from '../../../utils/url';
import { useTimeline } from './useTimeline';
import { TypewriterText } from './TypewriterText';
import type { SessionEvent, SessionPlayer } from '../../../types';
import './TimelinePage.css';

function extractEventText(event: SessionEvent): string {
  const payload = event.payload as Record<string, unknown> | null;
  if (payload && typeof payload === 'object') {
    const candidate = payload.text ?? payload.narration ?? payload.message ?? payload.content;
    if (typeof candidate === 'string') return candidate;
  }
  return event.type;
}

function EventRow({ event }: { event: SessionEvent }) {
  const isNarration = event.type === 'narration' || event.type === 'scene_narration';
  return (
    <li className="timeline-event-row">
      <p className="timeline-event-type">{event.type}</p>
      <p className="timeline-event-text">
        {isNarration ? <TypewriterText text={extractEventText(event)} /> : extractEventText(event)}
      </p>
    </li>
  );
}

function HeroAvatar({ player, index }: { player: SessionPlayer; index: number }) {
  const hero = player.hero;
  return (
    <div className="timeline-hero-avatar-wrapper">
      <div
        className={`timeline-hero-avatar ${index === 0 ? 'timeline-hero-avatar-active' : ''}`}
      >
        {hero?.avatar_url ? (
          <img src={getAssetUrl(hero.avatar_url)} alt={hero.name} />
        ) : (
          <div className="timeline-hero-avatar-fallback">
            <span className="material-symbols-outlined">person</span>
          </div>
        )}
      </div>
      <span
        className={`timeline-hero-status-dot ${
          player.is_ready ? 'timeline-hero-status-dot-ready' : ''
        }`}
      />
    </div>
  );
}

// Limite de tentativas de refetch da campanha ao falhar o carregamento do
// áudio de introdução (URL assinada expira em 1h). Evita loop infinito caso
// o refetch continue retornando uma URL que falha por outro motivo.
const MAX_INTRO_AUDIO_RETRIES = 2;
const INTRO_AUDIO_RETRY_DELAY_MS = 800;

// NOTA (pendente de decisão do usuário): o componente QuickDrawer ("Consulta
// Rápida") foi removido junto com seu único gatilho de abertura (o botão do
// header, que não existe na screen Stitch 2dfb1622b97942779052362b50f8f1e2).
// Não há nenhum outro elemento na screen correta que abra essa gaveta. O
// hook useTimeline ainda expõe `drawerOpen`/`toggleDrawer` (não removidos de
// lá para não impactar outros possíveis consumidores), mas esta tela não os
// usa mais. Se a gaveta de consulta rápida ainda for necessária, precisa de
// um novo gatilho definido pelo usuário/spec.

export default function TimelinePage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id ?? '';

  const {
    session,
    campaign,
    players,
    loading,
    error,
    events,
    eventsLoading,
    hasMore,
    loadMoreEvents,
    introEntered,
    enterCampaign,
    refetchCampaign,
  } = useTimeline(sessionId);

  const scrollRef = useRef<HTMLUListElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showNewBelow, setShowNewBelow] = useState(false);

  // Retry/resiliência para expiração da URL assinada do áudio de introdução
  // (válida por 1h — ver spec 00190). Ao detectar erro de carregamento,
  // refaz o fetch da campanha para obter uma nova URL assinada e retoma a
  // reprodução; limitado a MAX_INTRO_AUDIO_RETRIES para evitar loop infinito.
  const introAudioRetryCountRef = useRef(0);
  const introAudioRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introAudioRef = useRef<HTMLAudioElement>(null);
  const [introAudioPlaying, setIntroAudioPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (introAudioRetryTimeoutRef.current) {
        clearTimeout(introAudioRetryTimeoutRef.current);
      }
    };
  }, []);

  function handleIntroAudioError() {
    if (introAudioRetryCountRef.current >= MAX_INTRO_AUDIO_RETRIES) return;
    introAudioRetryCountRef.current += 1;
    if (introAudioRetryTimeoutRef.current) clearTimeout(introAudioRetryTimeoutRef.current);
    introAudioRetryTimeoutRef.current = setTimeout(() => {
      refetchCampaign();
    }, INTRO_AUDIO_RETRY_DELAY_MS);
  }

  function handleIntroAudioLoaded() {
    introAudioRetryCountRef.current = 0;
  }

  function toggleIntroAudio() {
    const audio = introAudioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  useEffect(() => {
    if (!introEntered) return;
    const el = scrollRef.current;
    if (!el) return;
    if (autoScroll) {
      el.scrollTop = el.scrollHeight;
      setShowNewBelow(false);
    } else {
      setShowNewBelow(true);
    }
  }, [events, introEntered, autoScroll]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAutoScroll(distanceFromBottom < 80);
    if (distanceFromBottom < 80) setShowNewBelow(false);

    if (el.scrollTop < 60 && hasMore) {
      loadMoreEvents();
    }
  }

  function scrollToBottom() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setAutoScroll(true);
    setShowNewBelow(false);
  }

  if (loading) {
    return (
      <div className="timeline-root timeline-loading">
        <Spinner color="var(--color-primary)" size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="timeline-root timeline-loading">
        <p className="timeline-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="timeline-root">
      <header className="timeline-header">
        <h1 className="timeline-header-title">{campaign?.title ?? session?.name ?? '...'}</h1>
      </header>

      <main className="timeline-main">
        <section className="timeline-intro-card">
          <div className="timeline-intro-media">
            {campaign?.cover_image_url ? (
              <img src={getAssetUrl(campaign.cover_image_url)} alt={campaign?.title} />
            ) : (
              <div className="timeline-intro-media-fallback" />
            )}
            <div className="timeline-intro-media-gradient" />
            {campaign?.intro_narration_audio_url ? (
              <>
                <audio
                  ref={introAudioRef}
                  src={getAssetUrl(campaign.intro_narration_audio_url)}
                  onError={handleIntroAudioError}
                  onLoadedData={handleIntroAudioLoaded}
                  onPlay={() => setIntroAudioPlaying(true)}
                  onPause={() => setIntroAudioPlaying(false)}
                  onEnded={() => setIntroAudioPlaying(false)}
                />
                <button
                  className="timeline-intro-play-button"
                  onClick={toggleIntroAudio}
                  aria-label={introAudioPlaying ? 'Pausar narração' : 'Reproduzir narração'}
                >
                  <span className="material-symbols-outlined">
                    {introAudioPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>
              </>
            ) : (
              <button className="timeline-intro-play-button" disabled aria-label="Narração indisponível">
                <span className="material-symbols-outlined">play_arrow</span>
              </button>
            )}
          </div>
          <div className="timeline-intro-body">
            <p className="timeline-intro-description">
              {campaign?.description ?? 'Sem descrição disponível para esta campanha.'}
            </p>
          </div>
        </section>

        <section className="timeline-heroes-section">
          <h3 className="timeline-heroes-title">Heróis na Expedição</h3>
          <div className="timeline-heroes-row">
            {players.map((player, index) => (
              <HeroAvatar key={player.user_id} player={player} index={index} />
            ))}
          </div>
        </section>

        {!introEntered ? (
          <section className="timeline-cta-section">
            <button className="timeline-cta-button" onClick={enterCampaign}>
              <span>{campaign?.start_cta_label || 'Iniciar Aventura'}</span>
            </button>
            {campaign?.start_cta_subtext && (
              <span className="timeline-cta-subtext">{campaign.start_cta_subtext}</span>
            )}
          </section>
        ) : (
          <section className="timeline-events-section">
            <h3 className="timeline-events-title">Linha do Tempo</h3>
            {hasMore && (
              <button className="timeline-load-more" onClick={loadMoreEvents}>
                Carregar mais eventos
              </button>
            )}
            <ul className="timeline-events-list" ref={scrollRef} onScroll={handleScroll}>
              {eventsLoading ? (
                <li className="timeline-events-loading">
                  <Spinner color="var(--color-primary)" size="small" />
                </li>
              ) : events.length === 0 ? (
                <li className="timeline-events-empty">
                  Nenhum evento registrado ainda nesta sessão.
                </li>
              ) : (
                events.map((event) => <EventRow key={event.seq} event={event} />)
              )}
            </ul>
            {showNewBelow && (
              <button className="timeline-new-events-button" onClick={scrollToBottom}>
                Novas ações abaixo
                <span className="material-symbols-outlined">arrow_downward</span>
              </button>
            )}
          </section>
        )}
      </main>

      {introEntered && (
        <footer className="timeline-action-bar">
          <p className="timeline-action-bar-placeholder">
            Aguardando ações do turno atual...
          </p>
        </footer>
      )}
    </div>
  );
}
