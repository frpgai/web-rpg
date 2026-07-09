import './SessionBottomNav.css';

type SessionNavTab = 'session' | 'chat' | 'map' | 'options';

const TABS: { id: SessionNavTab; icon: string; label: string }[] = [
  { id: 'session', icon: 'swords', label: 'Sessão' },
  { id: 'chat', icon: 'chat_bubble', label: 'Chat' },
  { id: 'map', icon: 'explore', label: 'World Map' },
  { id: 'options', icon: 'settings', label: 'Options' },
];

/**
 * Bottom nav das telas de sessão ativa (Storytelling, Timeline, Mesa de
 * Jogo Ativa) — réplica pixel-perfect do Stitch (project
 * 15326270198202696484, screens 5a5d72af972449828dca5c2df0e8ab62 e
 * fa77bf96766d4bbcafa4ea2ff29c6d43): 4 abas (Sessão/Chat/World Map/Options)
 * com ícone + rótulo, aba "Sessão" sempre ativa (glow roxo) enquanto o
 * usuário está em uma sessão em andamento.
 *
 * Distinta do `BottomNav` global (home/heroes/social/settings) porque o
 * Stitch usa um conjunto de abas completamente diferente para o contexto de
 * "dentro de uma sessão" — ver decisão documentada em `AppLayout.tsx`.
 *
 * "Chat" e "World Map" ainda não têm telas implementadas — pressioná-los é
 * no-op documentado até existir uma spec para essas rotas.
 */
export function SessionBottomNav() {
  function handlePress(tab: SessionNavTab) {
    if (tab === 'session') return;
    // eslint-disable-next-line no-console
    console.info(`SessionBottomNav: aba "${tab}" ainda não tem tela implementada.`);
  }

  return (
    <nav className="sessionbottomnav-root">
      {TABS.map((tab) => {
        const isActive = tab.id === 'session';
        return (
          <button
            key={tab.id}
            type="button"
            className={`sessionbottomnav-tab ${isActive ? 'sessionbottomnav-tab-active' : ''}`}
            onClick={() => handlePress(tab.id)}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            <span className="sessionbottomnav-tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
