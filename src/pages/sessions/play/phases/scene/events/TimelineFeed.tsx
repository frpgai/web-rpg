import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getAssetUrl } from '../../../../../../utils/url';
import { useAmbientVolume } from '../../../../../../utils/useAmbientVolume';
import { Spinner } from '../../../../../../components/ui/Spinner';
import { TypewriterText } from '../TypewriterText';
import type { SceneDetail, SessionEvent, SessionPlayer } from '../../../../../../types';
import './TimelineFeed.css';

type Props = {
  scene: SceneDetail;
  events: SessionEvent[];
  loading: boolean;
  // Usado para resolver `hero_id` -> nome do herói (be-rpg PR #76,
  // scene_investigation) — mesmo padrão de `useNpcGroupConversations.ts`
  // (sessionApi.getPlayers), já que `SessionEvent` só traz o id.
  players?: SessionPlayer[];
};

function resolveHeroName(players: SessionPlayer[] | undefined, heroId: string | null | undefined): string {
  if (!heroId) return 'Alguém';
  const player = players?.find((p) => p.hero?.id === heroId);
  return player?.hero?.name ?? player?.username ?? 'Alguém';
}

function extractText(event: SessionEvent): string {
  const payload = event.payload as Record<string, unknown> | null;
  if (payload && typeof payload === 'object') {
    const candidate = payload.text ?? payload.label ?? payload.message;
    if (typeof candidate === 'string') return candidate;
  }
  return event.type;
}

// Marcador sutil para eventos com `revealed === false` (be-rpg PR #74,
// implicit ack) — indica que o evento é novo desde a última visita à cena.
function NewEventBadge() {
  return <span className="timelinefeed-badge-new" aria-label="Novo" title="Novo" />;
}

function DiceRollRow({ event }: { event: SessionEvent }) {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const roll = typeof payload.roll === 'number' ? payload.roll : undefined;
  const modifier = typeof payload.modifier === 'number' ? payload.modifier : 0;
  const total = typeof payload.total === 'number' ? payload.total : (roll ?? 0) + modifier;
  const success = payload.success === true;

  return (
    <li className="timelinefeed-row timelinefeed-row-dice">
      {event.revealed === false && <NewEventBadge />}
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

function PoiInvestigationRow({ event, scene }: { event: SessionEvent; scene: SceneDetail }) {
  // SessionScenePOIView (be-rpg PR #70) não expõe mais `success_text`/
  // `failure_text` (estado interno de domínio) — a narração do resultado da
  // investigação não é mais renderizada aqui; sem esse dado, a linha mostra
  // apenas o resultado numérico da rolagem em vez de inventar um texto.
  const poi = scene.points_of_interest.find((p) => p.id === event.poi_id);

  return (
    <li className="timelinefeed-row timelinefeed-row-dice">
      {event.revealed === false && <NewEventBadge />}
      <span className="timelinefeed-dice-badge">d20</span>
      <div className="timelinefeed-dice-body">
        <span className="timelinefeed-dice-total">
          {poi?.display_name ?? 'Local'}: {event.roll ?? '?'} {(event.modifier ?? 0) >= 0 ? '+' : ''}
          {event.modifier ?? 0} = {event.total ?? '?'} (CD {event.dc ?? '?'})
        </span>
        <span
          className={`timelinefeed-dice-result ${
            event.success ? 'timelinefeed-dice-result-success' : 'timelinefeed-dice-result-failure'
          }`}
        >
          {event.success ? 'Sucesso' : 'Falha'}
        </span>
      </div>
    </li>
  );
}

// Evento `scene_investigation` (be-rpg PR #76) — gravado UMA vez por ação
// "Vasculhar o Local" (busca geral na cena), distinto de `poi_investigation`
// (investigação direcionada a um POI específico já conhecido). Ao contrário
// de `PoiInvestigationRow`, aqui a linha exibe a sentença narrativa completa
// (herói + perícia traduzida + rolagem + resultado + POIs revelados), como
// especificado na spec do evento.
function SceneInvestigationRow({
  event,
  scene,
  players,
}: {
  event: SessionEvent;
  scene: SceneDetail;
  players?: SessionPlayer[];
}) {
  const { t } = useTranslation(['skills']);

  const heroName = resolveHeroName(players, event.hero_id);
  const skillName = event.skill_check
    ? t(`${event.skill_check}.name`, { ns: 'skills' }) || event.skill_check
    : 'Percepção';
  const roll = event.roll ?? 0;
  const modifier = event.modifier ?? 0;
  const total = event.total ?? roll + modifier;
  const success = event.success === true;

  const discoveredNames = (event.discovered_poi_ids ?? [])
    .map((id) => scene.points_of_interest.find((p) => p.id === id)?.display_name)
    .filter((name): name is string => Boolean(name));

  let flavorText: string;
  if (!success) {
    flavorText = 'Você fez uma busca rápida, mas não foi muito meticuloso e não encontrou nada.';
  } else if (discoveredNames.length === 0) {
    flavorText = 'Você vasculhou a área com atenção, mas não parece haver nada escondido por aqui.';
  } else {
    flavorText = `Revelou: ${discoveredNames.join(', ')}.`;
  }

  const sentence = `${heroName} vasculhou o local e rolou ${skillName}: ${roll} ${
    modifier >= 0 ? '+' : '-'
  } ${Math.abs(modifier)} = ${total} (${success ? 'Sucesso' : 'Falha'}). ${flavorText}`;

  return (
    <li className="timelinefeed-row timelinefeed-row-dice">
      {event.revealed === false && <NewEventBadge />}
      <span className="timelinefeed-dice-badge">d20</span>
      <div className="timelinefeed-dice-body">
        <span className="timelinefeed-dice-total">{sentence}</span>
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
      {event.revealed === false && <NewEventBadge />}
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

export function TimelineFeed({ scene, events, loading, players }: Props) {
  const ambientAudioRef = useRef<HTMLAudioElement>(null);
  const transitionAudioRef = useRef<HTMLAudioElement>(null);
  useAmbientVolume(ambientAudioRef);

  const transitionSrc = scene.audio_transition_url;
  const ambientSrc = scene.ambient_soundtrack_url;
  const narrationAudioSrc = scene.intro_narration_audio_url;

  // Efeitos sonoros da cena, em ordem (spec 00153/scene.md seção 1): toca o
  // som de transição imediatamente, inicia a trilha ambiente em loop, e só
  // então (se houver) a narração de introdução — feita via autoPlay no
  // elemento <audio> abaixo.
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
            if (event.type === 'dice_roll') return <DiceRollRow key={event.id} event={event} />;
            if (event.type === 'npc_dialogue_choice') {
              return <NpcSpeechRow key={event.id} event={event} scene={scene} />;
            }
            if (event.type === 'poi_investigation') {
              return <PoiInvestigationRow key={event.id} event={event} scene={scene} />;
            }
            if (event.type === 'scene_investigation') {
              return (
                <SceneInvestigationRow key={event.id} event={event} scene={scene} players={players} />
              );
            }
            return (
              <li key={event.id} className="timelinefeed-row timelinefeed-row-generic">
                {event.revealed === false && <NewEventBadge />}
                <p className="timelinefeed-generic-text">{extractText(event)}</p>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
