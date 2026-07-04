import { useEffect, useRef, useState } from 'react';
import { getAssetUrl } from '../../../utils/url';
import type { CampaignDetail, SessionDetail, SessionPlayer } from '../../../types';
import './CampaignIntro.css';

type Props = {
  session: SessionDetail | null;
  campaign: CampaignDetail | null;
  players: SessionPlayer[];
  onEnter: () => void;
  refetchCampaign: () => Promise<void>;
};

// Limite de tentativas de refetch da campanha ao falhar o carregamento do
// áudio de introdução (URL assinada expira em 1h). Evita loop infinito caso
// o refetch continue retornando uma URL que falha por outro motivo.
const MAX_INTRO_AUDIO_RETRIES = 2;
const INTRO_AUDIO_RETRY_DELAY_MS = 800;

function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function HeroAvatar({ player, index }: { player: SessionPlayer; index: number }) {
  const hero = player.hero;
  return (
    <div className="campaignintro-hero-avatar-wrapper">
      <div
        className={`campaignintro-hero-avatar ${index === 0 ? 'campaignintro-hero-avatar-active' : ''}`}
      >
        {hero?.avatar_url ? (
          <img src={getAssetUrl(hero.avatar_url)} alt={hero.name} />
        ) : (
          <div className="campaignintro-hero-avatar-fallback">
            <span className="material-symbols-outlined">person</span>
          </div>
        )}
      </div>
      <span
        className={`campaignintro-hero-status-dot ${
          player.is_ready ? 'campaignintro-hero-status-dot-ready' : ''
        }`}
      />
    </div>
  );
}

/**
 * Fase inicial da Mesa de Jogo Ativa (spec 00190, "iniciar campanha"),
 * absorvida de TimelinePage.tsx: título da campanha, áudio de introdução
 * geral, avatares dos heróis participantes e CTA para avançar à fase de
 * storytelling. Fase local (efêmera), não persistida no backend — o avanço
 * de fase acontece só no client via `onEnter`, sem navegação de rota (já
 * estamos em /app/sessions/:id/play).
 */
export function CampaignIntro({ session, campaign, players, onEnter, refetchCampaign }: Props) {
  // Retry/resiliência para expiração da URL assinada do áudio de introdução
  // (válida por 1h — ver spec 00190). Ao detectar erro de carregamento,
  // refaz o fetch da campanha para obter uma nova URL assinada e retoma a
  // reprodução; limitado a MAX_INTRO_AUDIO_RETRIES para evitar loop infinito.
  const introAudioRetryCountRef = useRef(0);
  const introAudioRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introAudioRef = useRef<HTMLAudioElement>(null);
  const [introAudioPlaying, setIntroAudioPlaying] = useState(false);
  const [introCurrentTime, setIntroCurrentTime] = useState(0);
  const [introDuration, setIntroDuration] = useState(0);

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

  function handleIntroAudioTimeUpdate() {
    const audio = introAudioRef.current;
    if (!audio) return;
    setIntroCurrentTime(audio.currentTime);
  }

  function handleIntroAudioLoadedMetadata() {
    const audio = introAudioRef.current;
    if (!audio) return;
    setIntroDuration(audio.duration);
  }

  function handleIntroSeek(event: React.ChangeEvent<HTMLInputElement>) {
    const audio = introAudioRef.current;
    if (!audio) return;
    const value = Number(event.target.value);
    audio.currentTime = value;
    setIntroCurrentTime(value);
  }

  return (
    <div className="campaignintro-root">
      <header className="campaignintro-header">
        <h1 className="campaignintro-header-title">{campaign?.title ?? session?.name ?? '...'}</h1>
      </header>

      <main className="campaignintro-main">
        <section className="campaignintro-intro-card">
          <div className="campaignintro-intro-media">
            {campaign?.cover_image_url ? (
              <img src={getAssetUrl(campaign.cover_image_url)} alt={campaign?.title} />
            ) : (
              <div className="campaignintro-intro-media-fallback" />
            )}
            <div className="campaignintro-intro-media-gradient" />
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
                  onTimeUpdate={handleIntroAudioTimeUpdate}
                  onLoadedMetadata={handleIntroAudioLoadedMetadata}
                />
                <div className="campaignintro-intro-controls">
                  <button
                    className="campaignintro-intro-play-button"
                    onClick={toggleIntroAudio}
                    aria-label={introAudioPlaying ? 'Pausar narração' : 'Reproduzir narração'}
                  >
                    <span className="material-symbols-outlined">
                      {introAudioPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <div className="campaignintro-intro-seekbar-wrapper">
                    <input
                      type="range"
                      className="campaignintro-intro-seekbar"
                      min={0}
                      max={introDuration || 0}
                      step={0.1}
                      value={introCurrentTime}
                      onChange={handleIntroSeek}
                      disabled={!introDuration}
                      aria-label="Progresso da narração"
                    />
                    <span className="campaignintro-intro-time">
                      {formatAudioTime(introCurrentTime)} / {formatAudioTime(introDuration)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <button className="campaignintro-intro-play-button" disabled aria-label="Narração indisponível">
                <span className="material-symbols-outlined">play_arrow</span>
              </button>
            )}
          </div>
          <div className="campaignintro-intro-body">
            <p className="campaignintro-intro-description">
              {campaign?.description ?? 'Sem descrição disponível para esta campanha.'}
            </p>
          </div>
        </section>

        <section className="campaignintro-heroes-section">
          <h3 className="campaignintro-heroes-title">Heróis na Expedição</h3>
          <div className="campaignintro-heroes-row">
            {players.map((player, index) => (
              <HeroAvatar key={player.user_id} player={player} index={index} />
            ))}
          </div>
        </section>

        <section className="campaignintro-cta-section">
          <button className="campaignintro-cta-button" onClick={onEnter}>
            <span>{campaign?.start_cta_label || 'Iniciar Aventura'}</span>
          </button>
          {campaign?.start_cta_subtext && (
            <span className="campaignintro-cta-subtext">{campaign.start_cta_subtext}</span>
          )}
        </section>
      </main>
    </div>
  );
}
