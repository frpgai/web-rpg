import { useEffect, useRef } from 'react';
import { getAssetUrl } from '../../../utils/url';
import { useAmbientVolume } from '../../../utils/useAmbientVolume';
import { Spinner } from '../../../components/ui/Spinner';
import { TypewriterText } from '../timeline/TypewriterText';
import type { SceneDetail, SessionEvent } from '../../../types';
import './TimelineFeed.css';

type Props = {
  scene: SceneDetail;
  events: SessionEvent[];
  loading: boolean;
};

function extractText(event: SessionEvent): string {
  const payload = event.payload as Record<string, unknown> | null;
  if (payload && typeof payload === 'object') {
    const candidate = payload.text ?? payload.label ?? payload.message;
    if (typeof candidate === 'string') return candidate;
  }
  return event.type;
}

function DiceRollRow({ event }: { event: SessionEvent }) {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const roll = typeof payload.roll === 'number' ? payload.roll : undefined;
  const modifier = typeof payload.modifier === 'number' ? payload.modifier : 0;
  const total = typeof payload.total === 'number' ? payload.total : (roll ?? 0) + modifier;
  const success = payload.success === true;

  return (
    <li className="timelinefeed-row timelinefeed-row-dice">
      <span className="timelinefeed-dice-badge">d20</span>
      <div className="timelinefeed-dice-body">
        <span className="timelinefeed-dice-total">
          {roll ?? '?'} {modifier >= 0 ? '+' : ''}
          {modifier} = {total}
        </span>
        <span
          className={`timelinefeed-dice-result ${
            success ? 'timelinefeed-dice-result-success' : 'timelinefeed-dice-result-failure'
          }`}
        >
          {success ? 'Sucesso' : 'Falha'}
        </span>
      </div>
    </li>
  );
}

function NpcSpeechRow({ event, scene }: { event: SessionEvent; scene: SceneDetail }) {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const npcId = typeof payload.npc_id === 'string' ? payload.npc_id : undefined;
  const npc = scene.npcs.find((n) => n.id === npcId);

  return (
    <li className="timelinefeed-row timelinefeed-row-npc">
      {npc?.avatar_url ? (
        <img className="timelinefeed-npc-avatar" src={getAssetUrl(npc.avatar_url)} alt={npc.name} />
      ) : (
        <div className="timelinefeed-npc-avatar-fallback">
          <span className="material-symbols-outlined">person</span>
        </div>
      )}
      <div className="timelinefeed-npc-body">
        <span className="timelinefeed-npc-name">{npc?.name ?? 'NPC'}</span>
        <p className="timelinefeed-npc-text">{extractText(event)}</p>
      </div>
    </li>
  );
}

export function TimelineFeed({ scene, events, loading }: Props) {
  const ambientAudioRef = useRef<HTMLAudioElement>(null);
  const transitionAudioRef = useRef<HTMLAudioElement>(null);
  useAmbientVolume(ambientAudioRef);

  const transitionSrc = scene.audio_transition_file || scene.transition_sfx;
  const ambientSrc = scene.ambient_soundtrack_file || scene.ambient_soundtrack;
  const narrationAudioSrc = scene.intro_narration_audio_file;

  // Ao carregar/trocar de cena, toca o áudio de transição e (re)inicia a
  // trilha ambiente da cena — spec A00153 seção 4.2.
  useEffect(() => {
    transitionAudioRef.current?.play().catch(() => {});
    ambientAudioRef.current?.play().catch(() => {});
  }, [scene.id]);

  return (
    <section className="timelinefeed-root">
      {transitionSrc && <audio ref={transitionAudioRef} src={getAssetUrl(transitionSrc)} />}
      {ambientSrc && <audio ref={ambientAudioRef} src={getAssetUrl(ambientSrc)} loop />}

      {scene.intro_narration && (
        <div className="timelinefeed-scene-intro">
          <p className="timelinefeed-scene-intro-text">
            <TypewriterText text={scene.intro_narration} />
          </p>
          {narrationAudioSrc && <audio src={getAssetUrl(narrationAudioSrc)} autoPlay />}
        </div>
      )}

      <ul className="timelinefeed-list">
        {loading ? (
          <li className="timelinefeed-loading">
            <Spinner color="var(--color-primary)" size="small" />
          </li>
        ) : events.length === 0 ? (
          <li className="timelinefeed-empty">Nenhum evento registrado ainda nesta cena.</li>
        ) : (
          events.map((event) => {
            if (event.type === 'dice_roll') return <DiceRollRow key={event.seq} event={event} />;
            if (event.type === 'npc_dialogue_choice') {
              return <NpcSpeechRow key={event.seq} event={event} scene={scene} />;
            }
            return (
              <li key={event.seq} className="timelinefeed-row timelinefeed-row-generic">
                <p className="timelinefeed-generic-text">{extractText(event)}</p>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
