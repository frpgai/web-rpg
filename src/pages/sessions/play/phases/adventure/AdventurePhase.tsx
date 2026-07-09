import { useEffect, useRef, useState } from 'react';
import { sessionApi } from '../../../../../api/services/session';
import { useNextPhase } from '../../../../../hooks/useNextPhase';
import { getAssetUrl } from '../../../../../utils/url';
import { useAmbientVolume } from '../../../../../utils/useAmbientVolume';
import { SessionHeader } from '../../../../../components/navigation/SessionHeader';
import { Spinner } from '../../../../../components/ui/Spinner';
import { TypewriterText } from './TypewriterText';
import type { Adventure, SessionDetail } from '../../../../../types';
import './AdventurePhase.css';

type Props = {
  sessionId: string;
  session: SessionDetail;
  onAdvance: () => void;
  onWaitingForHost: () => void;
};

const TYPEWRITER_SPEED_MS = 18;
const PARAGRAPH_GAP_MS = 400;
const FADE_TO_BLACK_MS = 1200;
const VOICE_WAVE_BARS = 8;

function splitParagraphs(text?: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Fase "adventure" (spec 00190) — introdução cinemática do capítulo:
 * mídia de fundo, narração em typewriter e CTA para avançar para a fase
 * "scene". Adaptado de `play_old/StorytellingScreen.tsx`, agora buscando a
 * própria aventura (`GET /sessions/:id/adventure`) em vez de recebê-la de um
 * hook de máquina de estados do PlayPage.
 */
export function AdventurePhase({ sessionId, session, onAdvance, onWaitingForHost }: Props) {
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    sessionApi
      .getAdventure(sessionId)
      .then(setAdventure)
      .catch((err) => console.error('Failed to load adventure for storytelling:', err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const paragraphs = splitParagraphs(adventure?.intro_narration);
  const transitionSrc = adventure?.audio_transition_file || adventure?.transition_sfx;
  const narrationSrc = adventure?.intro_narration_audio_file;
  const ambientSrc = adventure?.ambient_soundtrack_file || adventure?.ambient_soundtrack;

  const [narrationEnded, setNarrationEnded] = useState(false);
  const [fading, setFading] = useState(false);

  const transitionAudioRef = useRef<HTMLAudioElement>(null);
  const narrationAudioRef = useRef<HTMLAudioElement>(null);
  const ambientAudioRef = useRef<HTMLAudioElement>(null);
  useAmbientVolume(ambientAudioRef);

  // Toca SFX de transição + trilha ambiente assim que a aventura carrega.
  useEffect(() => {
    if (!adventure) return;
    transitionAudioRef.current?.play().catch(() => {
      // autoplay pode ser bloqueado pelo browser até primeira interação —
      // sem fallback adicional aqui, o botão de entrar ainda depende do
      // typewriter/áudio de narração para aparecer.
    });
    ambientAudioRef.current?.play().catch(() => {});
  }, [adventure]);

  // Sem áudio de narração falada: revela o botão após o typewriter terminar
  // (estimado pela contagem de caracteres, já que TypewriterText não expõe
  // callback de conclusão hoje).
  useEffect(() => {
    setNarrationEnded(false);
    if (narrationSrc) return;
    if (paragraphs.length === 0) {
      setNarrationEnded(true);
      return;
    }
    const totalChars = paragraphs.reduce((acc, p) => acc + p.length, 0);
    const timeout = setTimeout(
      () => setNarrationEnded(true),
      totalChars * TYPEWRITER_SPEED_MS + paragraphs.length * PARAGRAPH_GAP_MS
    );
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrationSrc, adventure?.id]);

  // Avança para a próxima fase destrancada pelo Host (be-rpg PR #73):
  // `POST /sessions/:id/next-phase` marca a fase "adventure" como revelada
  // para este jogador. Em caso de sucesso, `onAdvance` refaz o fetch da
  // sessão no PlayPage para renderizar a próxima fase. Em caso de 422
  // `NO_NEXT_PHASE`, `onWaitingForHost` troca para o estado de espera.
  const { advance } = useNextPhase(sessionId, { onAdvance, onWaitingForHost });

  function handleEnter() {
    if (fading) return;
    setFading(true);
    setTimeout(advance, FADE_TO_BLACK_MS);
  }

  if (loading) {
    return (
      <div className="adventurephase-root adventurephase-loading">
        <Spinner color="var(--color-primary)" size="large" />
      </div>
    );
  }

  return (
    <div className="adventurephase-root">
      <SessionHeader title={session.name} />

      <div className="adventurephase-media">
        {adventure?.media_type === 'video' && adventure.media_url ? (
          <video
            className="adventurephase-media-el"
            src={getAssetUrl(adventure.media_url)}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : adventure?.media_url ? (
          <img
            className="adventurephase-media-el"
            src={getAssetUrl(adventure.media_url)}
            alt={adventure.title}
          />
        ) : (
          <div className="adventurephase-media-fallback" />
        )}
        <div className="adventurephase-media-gradient" />
      </div>

      {transitionSrc && <audio ref={transitionAudioRef} src={getAssetUrl(transitionSrc)} />}
      {ambientSrc && <audio ref={ambientAudioRef} src={getAssetUrl(ambientSrc)} loop />}
      {narrationSrc && (
        <audio
          ref={narrationAudioRef}
          src={getAssetUrl(narrationSrc)}
          autoPlay
          onEnded={() => setNarrationEnded(true)}
        />
      )}

      <section className="adventurephase-overlay">
        <div className="adventurephase-card">
          <span className="adventurephase-eyebrow">A Jornada Começa</span>
          <h1 className="adventurephase-title">{adventure?.title ?? '...'}</h1>
          <div className="adventurephase-divider" />

          <div className="adventurephase-narration">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="adventurephase-paragraph">
                <TypewriterText text={paragraph} speedMs={TYPEWRITER_SPEED_MS} />
              </p>
            ))}
          </div>

          <div className="adventurephase-voice-wave" aria-label="Narração Ativa">
            {Array.from({ length: VOICE_WAVE_BARS }).map((_, index) => (
              <div key={index} className="adventurephase-wave-bar" />
            ))}
          </div>

          <button
            className={`adventurephase-cta ${narrationEnded ? 'adventurephase-cta-visible' : ''}`}
            onClick={handleEnter}
            disabled={!narrationEnded}
          >
            <span className="material-symbols-outlined adventurephase-cta-icon">play_arrow</span>
            Entrar no Capítulo
          </button>
        </div>
      </section>

      <div className={`adventurephase-fade ${fading ? 'adventurephase-fade-active' : ''}`} />
    </div>
  );
}
