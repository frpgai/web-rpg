import { useEffect, useRef, useState } from 'react';
import { getAssetUrl } from '../../../utils/url';
import { useAmbientVolume } from '../../../utils/useAmbientVolume';
import { TypewriterText } from '../timeline/TypewriterText';
import type { Adventure } from '../../../types';
import './StorytellingScreen.css';

type Props = {
  adventure: Adventure | null;
  onEnter: () => Promise<unknown>;
};

const TYPEWRITER_SPEED_MS = 18;
const PARAGRAPH_GAP_MS = 400;
const FADE_TO_BLACK_MS = 1200;
const VOICE_WAVE_DELAYS = [0.1, 0.3, 0.2, 0.5, 0.4, 0.7, 0.2, 0.1];

function splitParagraphs(text?: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function StorytellingScreen({ adventure, onEnter }: Props) {
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

  function handleEnter() {
    if (fading) return;
    setFading(true);
    setTimeout(() => {
      onEnter();
    }, FADE_TO_BLACK_MS);
  }

  return (
    <div className="storytelling-root">
      <div className="storytelling-media">
        {adventure?.media_type === 'video' && adventure.media_url ? (
          <video
            className="storytelling-media-el"
            src={getAssetUrl(adventure.media_url)}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : adventure?.media_url ? (
          <img
            className="storytelling-media-el"
            src={getAssetUrl(adventure.media_url)}
            alt={adventure.title}
          />
        ) : (
          <div className="storytelling-media-fallback" />
        )}
        <div className="storytelling-media-gradient" />
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

      <section className="storytelling-overlay">
        <div className="storytelling-card">
          <span className="storytelling-eyebrow">A Jornada Começa</span>
          <h1 className="storytelling-title">{adventure?.title ?? '...'}</h1>
          <div className="storytelling-divider" />
          <div className="storytelling-narration">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="storytelling-paragraph">
                <TypewriterText text={paragraph} speedMs={TYPEWRITER_SPEED_MS} />
              </p>
            ))}
          </div>

          {!narrationEnded && (
            <div className="storytelling-voice-wave" aria-label="Narração Ativa">
              {Array.from({ length: 8 }).map((_, index) => (
                <span
                  key={index}
                  className="storytelling-voice-wave-bar"
                  style={{ animationDelay: `${VOICE_WAVE_DELAYS[index % VOICE_WAVE_DELAYS.length]}s` }}
                />
              ))}
            </div>
          )}

          <button
            className={`storytelling-cta ${narrationEnded ? 'storytelling-cta-visible' : ''}`}
            onClick={handleEnter}
            disabled={!narrationEnded}
          >
            <span className="material-symbols-outlined storytelling-cta-icon">play_arrow</span>
            Iniciar Capítulo
          </button>
        </div>
      </section>

      <div className={`storytelling-fade ${fading ? 'storytelling-fade-active' : ''}`} />
    </div>
  );
}
