import { useEffect, useRef, useState } from 'react';
import { sessionApi } from '../../../../../api/services/session';
import { campaignApi } from '../../../../../api/services/campaign';
import { getAssetUrl } from '../../../../../utils/url';
import { Spinner } from '../../../../../components/ui/Spinner';
import type { CampaignDetail, SessionDetail, SessionPlayer } from '../../../../../types';
import './CampaignPhase.css';

type Props = {
  sessionId: string;
  session: SessionDetail;
  onAdvance: () => void;
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
    <div className="campaignphase-hero-avatar-wrapper">
      <div
        className={`campaignphase-hero-avatar ${index === 0 ? 'campaignphase-hero-avatar-active' : ''}`}
      >
        {hero?.avatar_url ? (
          <img src={getAssetUrl(hero.avatar_url)} alt={hero.name} />
        ) : (
          <div className="campaignphase-hero-avatar-fallback">
            <span className="material-symbols-outlined">person</span>
          </div>
        )}
      </div>
      <span
        className={`campaignphase-hero-status-dot ${
          player.is_ready ? 'campaignphase-hero-status-dot-ready' : ''
        }`}
      />
    </div>
  );
}

/**
 * Fase "campaign" (spec 00190) — introdução da campanha: título, áudio de
 * introdução geral, avatares dos heróis participantes e CTA para avançar
 * para a fase "adventure". Adaptado de `play_old/CampaignIntro.tsx`, agora
 * buscando seus próprios dados (campanha + jogadores) a partir de
 * `session.campaign_id` em vez de recebê-los de um hook de máquina de
 * estados do PlayPage.
 */
export function CampaignPhase({ sessionId, session, onAdvance }: Props) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaign = () =>
    campaignApi
      .getDetail(session.campaign_id)
      .then(setCampaign)
      .catch((err) => console.error('Failed to load campaign for intro:', err));

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchCampaign(),
      sessionApi
        .getPlayers(sessionId)
        .then(setPlayers)
        .catch((err) => console.error('Failed to load session players:', err)),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, session.campaign_id]);

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
      fetchCampaign();
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

  // Avança para a fase "adventure": grava o evento `narrative_entered` com
  // entity_type "campaign" (só timeline, não muda a fase) e chama
  // `next-phase`, que é quem de fato revela a próxima fase do jogador
  // (be-rpg internal/session/service.go, Service.NextPhase / sessions_targets)
  // — só então o refetch feito por `onAdvance` no PlayPage reflete a mudança.
  function handleEnter() {
    sessionApi
      .createEvent(sessionId, {
        type: 'narrative_entered',
        entity_type: 'campaign',
        entity_id: session.campaign_id,
      })
      .catch((err) => console.error('Failed to log campaign narrative_entered event:', err))
      .then(() => sessionApi.nextPhase(sessionId))
      .catch((err) => console.error('Failed to advance to next phase:', err))
      .finally(onAdvance);
  }

  if (loading) {
    return (
      <div className="campaignphase-root campaignphase-loading">
        <Spinner color="var(--color-primary)" size="large" />
      </div>
    );
  }

  return (
    <div className="campaignphase-root">
      <header className="campaignphase-header">
        <h1 className="campaignphase-header-title">{campaign?.title ?? session.name}</h1>
      </header>

      <main className="campaignphase-main">
        <section className="campaignphase-intro-card">
          <div className="campaignphase-intro-media">
            {campaign?.cover_image_url ? (
              <img src={getAssetUrl(campaign.cover_image_url)} alt={campaign?.title} />
            ) : (
              <div className="campaignphase-intro-media-fallback" />
            )}
            <div className="campaignphase-intro-media-gradient" />
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
                <div className="campaignphase-intro-controls">
                  <button
                    className="campaignphase-intro-play-button"
                    onClick={toggleIntroAudio}
                    aria-label={introAudioPlaying ? 'Pausar narração' : 'Reproduzir narração'}
                  >
                    <span className="material-symbols-outlined">
                      {introAudioPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <div className="campaignphase-intro-seekbar-wrapper">
                    <input
                      type="range"
                      className="campaignphase-intro-seekbar"
                      min={0}
                      max={introDuration || 0}
                      step={0.1}
                      value={introCurrentTime}
                      onChange={handleIntroSeek}
                      disabled={!introDuration}
                      aria-label="Progresso da narração"
                    />
                    <span className="campaignphase-intro-time">
                      {formatAudioTime(introCurrentTime)} / {formatAudioTime(introDuration)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <button className="campaignphase-intro-play-button" disabled aria-label="Narração indisponível">
                <span className="material-symbols-outlined">play_arrow</span>
              </button>
            )}
          </div>
          <div className="campaignphase-intro-body">
            <p className="campaignphase-intro-description">
              {campaign?.description ?? 'Sem descrição disponível para esta campanha.'}
            </p>
          </div>
        </section>

        <section className="campaignphase-heroes-section">
          <h3 className="campaignphase-heroes-title">Heróis na Expedição</h3>
          <div className="campaignphase-heroes-row">
            {players.map((player, index) => (
              <HeroAvatar key={player.user_id} player={player} index={index} />
            ))}
          </div>
        </section>

        <section className="campaignphase-cta-section">
          <button className="campaignphase-cta-button" onClick={handleEnter}>
            <span>{campaign?.start_cta_label || 'Iniciar Aventura'}</span>
          </button>
          {campaign?.start_cta_subtext && (
            <span className="campaignphase-cta-subtext">{campaign.start_cta_subtext}</span>
          )}
        </section>
      </main>
    </div>
  );
}
