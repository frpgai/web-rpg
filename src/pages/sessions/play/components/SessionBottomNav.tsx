import { useState } from 'react';
import { useSessionEventsNotify } from '../../../../hooks/useSessionEventsNotify';
import { SessionEventsSheet } from './SessionEventsSheet';
import './SessionBottomNav.css';

type SessionNavTab = 'missions' | 'log' | 'team' | 'grimoire';

const TABS: { id: SessionNavTab; icon: string; label: string }[] = [
  { id: 'missions', icon: 'swords', label: 'Missões' },
  { id: 'log', icon: 'history', label: 'Log' },
  { id: 'team', icon: 'group', label: 'Equipe' },
  { id: 'grimoire', icon: 'auto_stories', label: 'Grimório' },
];

type Props = {
  sessionId: string;
  sceneId: string | null;
};

/**
 * Bottom nav das telas de sessão ativa (Storytelling, Timeline, Mesa de
 * Jogo Ativa) — réplica pixel-perfect do Stitch (project
 * 15326270198202696484, screens 5a5d72af972449828dca5c2df0e8ab62 e
 * fa77bf96766d4bbcafa4ea2ff29c6d43): 4 abas (Sessão/Chat/World Map/Options)
 * com ícone + rótulo, aba "Sessão" sempre ativa (glow roxo) enquanto o
 * usuário está em uma sessão em andamento.
 *
 * A aba "Sessão" é também o ícone de notificação/timeline: exibe um badge
 * (bolinha vermelha) quando `GET .../events/notify` (be-rpg PR #75) indica
 * `has_unread === true`, e abre o BottomSheet do Log de Aventura ao ser
 * pressionada (screens Stitch 1837156ba8ef434b94393f8f0e73cbc4 / empty state
 * e c49921ed1df342a3bf33ecdb11daa8ef / lista ativa).
 *
 * "Chat" e "World Map" ainda não têm telas implementadas — pressioná-los é
 * no-op documentado até existir uma spec para essas rotas.
 */
export function SessionBottomNav({ sessionId, sceneId }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { hasUnread, refresh } = useSessionEventsNotify(sessionId, sceneId ?? undefined);

  function handlePress(tab: SessionNavTab) {
    if (tab === 'log') {
      setSheetOpen(true);
      return;
    }
    // eslint-disable-next-line no-console
    console.info(`SessionBottomNav: aba "${tab}" ainda não tem tela implementada.`);
  }

  return (
    <>
      <nav className="sessionbottomnav-root">
        {TABS.map((tab) => {
          const isActive = tab.id === 'log';
          return (
            <button
              key={tab.id}
              type="button"
              className={`sessionbottomnav-tab ${isActive ? 'sessionbottomnav-tab-active' : ''}`}
              onClick={() => handlePress(tab.id)}
            >
              <span className="sessionbottomnav-icon-wrapper">
                <span
                  className="material-symbols-outlined"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {tab.icon}
                </span>
                {tab.id === 'log' && hasUnread && (
                  <span className="sessionbottomnav-badge" aria-label="Notificações não lidas" />
                )}
              </span>
              <span className="sessionbottomnav-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {sheetOpen && sceneId && (
        <SessionEventsSheet
          sessionId={sessionId}
          sceneId={sceneId}
          onClose={() => setSheetOpen(false)}
          onQueueCleared={refresh}
        />
      )}
    </>
  );
}
