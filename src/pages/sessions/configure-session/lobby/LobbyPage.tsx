import { useParams } from 'wouter';
import { Spinner } from '../../../../components/ui/Spinner';
import { useLobby } from './useLobby';
import { getAssetUrl } from '../../../../utils/url';
import type { SessionPlayerDetail } from '../../../../types';
import './LobbyPage.css';

function PlayerCard({ player }: { player: SessionPlayerDetail }) {
  const hero = player.hero;
  return (
    <div className="lobby-player-card">
      {player.is_owner && <span className="lobby-player-owner-badge">ANFITRIÃO</span>}
      <div className={`lobby-player-avatar ${player.is_owner ? 'lobby-player-avatar-owner' : ''}`}>
        {hero?.avatar_url ? (
          <img src={getAssetUrl(hero.avatar_url)} alt={hero.name} />
        ) : (
          <div className="lobby-player-avatar-fallback">
            <span className="material-symbols-outlined">person</span>
          </div>
        )}
        <span className="lobby-player-online-dot" />
      </div>
      <p className="lobby-player-name">{hero?.name ?? player.username}</p>
      <p className="lobby-player-class">{hero ? `${hero.class} - Nível ${hero.level}` : player.username}</p>
      <div className={`lobby-player-status ${player.is_ready ? 'lobby-player-status-ready' : 'lobby-player-status-pending'}`}>
        {player.is_ready ? 'PRONTO' : 'CUSTOMIZANDO...'}
      </div>
    </div>
  );
}

function PlayerSkeletonCard() {
  return (
    <div className="lobby-player-card lobby-skeleton-card">
      <div className="lobby-skeleton-avatar" />
      <div className="lobby-skeleton-line lobby-skeleton-line-name" />
      <div className="lobby-skeleton-line lobby-skeleton-line-class" />
      <div className="lobby-skeleton-line lobby-skeleton-line-status" />
    </div>
  );
}

function EmptySlotCard() {
  return (
    <div className="lobby-empty-slot">
      <div className="lobby-empty-slot-icon">
        <span className="material-symbols-outlined">person_add</span>
      </div>
      <p className="lobby-empty-slot-label">Aguardando Herói...</p>
    </div>
  );
}

export default function LobbyPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id ?? '';

  const {
    session,
    players,
    loading,
    error,
    isOwner,
    minPlayers,
    maxPlayers,
    playersCount,
    canStart,
    starting,
    startError,
    startButtonTooltip,
    startSession,
    inviteLink,
    copied,
    copyInviteLink,
    goToDashboard,
  } = useLobby(sessionId);

  const emptySlots = Math.max(0, maxPlayers - playersCount);

  return (
    <div className="lobby-root">
      <header className="lobby-header">
        <button className="lobby-back" onClick={goToDashboard} aria-label="Voltar">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="lobby-header-title">Lobby da Sessão</h1>
        <div className="lobby-header-spacer" />
      </header>

      <main className="lobby-main">
        <section className="lobby-title-section">
          <h2 className="lobby-session-name">{session?.name ?? '...'}</h2>
          <div className="lobby-status-row">
            <span className="lobby-status-dot" />
            <p className="lobby-status-label">Aguardando Jogadores...</p>
          </div>
        </section>

        <section className="lobby-invite-card">
          <div className="lobby-invite-info">
            <p className="lobby-invite-label">CONVITE DA SESSÃO</p>
            <p className="lobby-invite-link">{inviteLink || '...'}</p>
          </div>
          <button
            type="button"
            className={`lobby-copy-button ${copied ? 'lobby-copy-button-copied' : ''}`}
            onClick={copyInviteLink}
            disabled={!inviteLink}
          >
            <span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'COPIADO!' : 'COPIAR LINK'}
          </button>
        </section>

        {error && <p className="lobby-error">{error}</p>}

        <section className="lobby-players-grid">
          {loading ? (
            <>
              <PlayerSkeletonCard />
              <PlayerSkeletonCard />
              <PlayerSkeletonCard />
            </>
          ) : (
            <>
              {players.map((player) => (
                <PlayerCard key={player.user_id} player={player} />
              ))}
              {Array.from({ length: emptySlots }).map((_, index) => (
                <EmptySlotCard key={`empty-${index}`} />
              ))}
            </>
          )}
        </section>

        {!loading && (
          <p className="lobby-min-players-help">
            {playersCount} de {minPlayers} (mín) a {maxPlayers} (máx) jogadores.
          </p>
        )}

        {startError && <p className="lobby-error">{startError}</p>}
      </main>

      <footer className="lobby-footer">
        {isOwner ? (
          <button
            type="button"
            className={`lobby-start-button ${canStart ? 'lobby-start-button-active' : ''}`}
            onClick={startSession}
            disabled={!canStart}
            title={startButtonTooltip}
          >
            {starting ? (
              <Spinner color="var(--color-on-primary)" size="small" />
            ) : (
              <>
                Iniciar Aventura
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
        ) : (
          <p className="lobby-waiting-owner">Aguardando início pelo Host...</p>
        )}
        <button type="button" className="lobby-cancel-button" onClick={goToDashboard}>
          Voltar
        </button>
      </footer>
    </div>
  );
}
