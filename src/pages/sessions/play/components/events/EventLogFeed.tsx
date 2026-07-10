import { useTranslation } from 'react-i18next';
import { Avatar } from '../../../../../components/ui/Avatar';
import type { SessionEvent } from '../../../../../types';
import './EventLogFeed.css';

type Props = {
  events: SessionEvent[];
};

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(0, Math.round(diffMs / 60000));
  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Há ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `Há ${diffD}d`;
}

function extractText(event: SessionEvent, t: any): string {
  if (event.type === 'scene_investigation') {
    const skillCheck = event.skill_check || 'investigation';
    const skillName = t(`skills:${skillCheck}.name`, { defaultValue: skillCheck });
    const successKey = event.success ? 'true' : 'false';
    return t(`common:events.scene_investigation_success_${successKey}`, { skill: skillName });
  }

  const payload = event.payload as Record<string, unknown> | null;
  if (payload && typeof payload === 'object') {
    const candidate = payload.text ?? payload.label ?? payload.message;
    if (typeof candidate === 'string') return candidate;
  }
  if (event.choice_text) return event.choice_text;
  return event.type;
}

function isRollLike(event: SessionEvent): boolean {
  return (
    event.type === 'dice_roll' || event.type === 'poi_investigation' || event.type === 'scene_investigation'
  );
}

function RollBadge({ event }: { event: SessionEvent }) {
  const roll = event.roll ?? '?';
  const modifier = event.modifier ?? 0;
  const total = event.total ?? '?';
  const dc = event.dc;
  return (
    <div className="eventlogfeed-roll-badge">
      d20({roll}) {modifier >= 0 ? '+' : ''}
      {modifier} = {total}
      {dc != null ? ` (CD ${dc})` : ''}
    </div>
  );
}

function EventCard({ event }: { event: SessionEvent }) {
  const { t } = useTranslation(['common', 'skills']);
  const unread = event.revealed === false;
  const cardClass = `eventlogfeed-card ${unread ? 'eventlogfeed-card-unread' : 'eventlogfeed-card-read'}`;

  const heroLabel = event.hero_name || (event.hero_id ? `Herói ${event.hero_id.slice(0, 8)}` : null);
  const isNarrative = !isRollLike(event) && !event.npc_id;
  const isNpc = !isRollLike(event) && !!event.npc_id;

  return (
    <li className={cardClass}>
      <div className="eventlogfeed-avatar-wrapper">
        {isNpc || isNarrative ? (
          <div className="ui-avatar ui-avatar-npc">
            <span className="material-symbols-outlined">psychiatry</span>
          </div>
        ) : (
          <Avatar
            url={event.hero_avatar_url}
            name={heroLabel ?? undefined}
            size={48}
          />
        )}
        {unread && <span className="eventlogfeed-avatar-dot" />}
      </div>

      <div className="eventlogfeed-body">
        <div className="eventlogfeed-body-header">
          <h3 className="eventlogfeed-name">
            {heroLabel ?? (isNarrative ? 'Narrador' : 'Evento')}{' '}
            <span className="eventlogfeed-time">{formatRelative(event.created_at)}</span>
          </h3>
          {isRollLike(event) && <RollBadge event={event} />}
        </div>

        {isNarrative ? (
          <p className="eventlogfeed-narrative-text">"{extractText(event, t)}"</p>
        ) : (
          <p className="eventlogfeed-text">{extractText(event, t)}</p>
        )}

        {isRollLike(event) && event.success != null && (
          <span
            className={`eventlogfeed-result ${
              event.success ? 'eventlogfeed-result-success' : 'eventlogfeed-result-failure'
            }`}
          >
            {event.success ? 'Sucesso' : 'Falha'}
          </span>
        )}
      </div>
    </li>
  );
}

/**
 * Lista de eventos do BottomSheet "Log de Aventura" (Stitch screen
 * c49921ed1df342a3bf33ecdb11daa8ef). Visualmente distinta da `TimelineFeed`
 * já existente em `phases/scene/events/TimelineFeed.tsx` (que é acoplada a
 * `SceneDetail` — mapa, NPCs, áudio ambiente — e usada dentro do próprio
 * `ScenePhase`); este componente é standalone, alimentado só pela página de
 * eventos, exatamente como pede o design do BottomSheet.
 */
export function EventLogFeed({ events }: Props) {
  return (
    <ul className="eventlogfeed-list">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </ul>
  );
}
