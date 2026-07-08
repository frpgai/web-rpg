import { useRef, useState } from 'react';
import { getAssetUrl } from '../../../utils/url';
import { useAudioStore } from '../../../stores/audioStore';
import { Spinner } from '../../../components/ui/Spinner';
import { useNpcDialogue } from './useNpcDialogue';
import { useNpcGroupConversations } from './useNpcGroupConversations';
import type { SceneNPC } from '../../../types';
import './NPCDialogueModal.css';

type Props = {
  sessionId: string;
  npc: SceneNPC;
  onClose: () => void;
  onEventLogged: () => void;
};

type Tab = 'conversar' | 'grupo';

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function NPCDialogueModal({ sessionId, npc, onClose, onEventLogged }: Props) {
  const [tab, setTab] = useState<Tab>('conversar');
  const { currentNode, loading, error, choose } = useNpcDialogue(sessionId, npc, onEventLogged);
  const { entries: groupEntries, loading: groupLoading, error: groupError } = useNpcGroupConversations(
    sessionId,
    tab === 'grupo' ? npc : null
  );
  const duckAmbient = useAudioStore((s) => s.duckAmbient);
  const restoreAmbient = useAudioStore((s) => s.restoreAmbient);
  const voiceAudioRef = useRef<HTMLAudioElement>(null);
  const replayAudioRef = useRef<HTMLAudioElement>(null);

  function replay(url: string) {
    if (!replayAudioRef.current) return;
    replayAudioRef.current.src = getAssetUrl(url);
    replayAudioRef.current.play().catch(() => {});
  }

  return (
    <div className="npcdialogue-overlay" role="dialog" aria-modal="true">
      <div className="npcdialogue-modal">
        <header className="npcdialogue-header">
          {npc.avatar_url ? (
            <img className="npcdialogue-avatar" src={getAssetUrl(npc.avatar_url)} alt={npc.name} />
          ) : (
            <div className="npcdialogue-avatar-fallback">
              <span className="material-symbols-outlined">person</span>
            </div>
          )}
          <h2 className="npcdialogue-name">{npc.name}</h2>
          <button type="button" className="npcdialogue-close" onClick={onClose} aria-label="Fechar diálogo">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="npcdialogue-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'conversar'}
            className={`npcdialogue-tab${tab === 'conversar' ? ' npcdialogue-tab-active' : ''}`}
            onClick={() => setTab('conversar')}
          >
            Conversar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'grupo'}
            className={`npcdialogue-tab${tab === 'grupo' ? ' npcdialogue-tab-active' : ''}`}
            onClick={() => setTab('grupo')}
          >
            Conversas do Grupo
          </button>
        </div>

        <div className="npcdialogue-body">
          {tab === 'conversar' ? (
            loading ? (
              <div className="npcdialogue-loading">
                <Spinner color="var(--color-primary)" size="medium" />
              </div>
            ) : error ? (
              <p className="npcdialogue-error">{error}</p>
            ) : currentNode ? (
              <>
                <p className="npcdialogue-text">{currentNode.text}</p>

                {currentNode.audio_url && (
                  <audio
                    ref={voiceAudioRef}
                    className="npcdialogue-audio"
                    src={getAssetUrl(currentNode.audio_url)}
                    controls
                    autoPlay
                    onPlay={duckAmbient}
                    onPause={restoreAmbient}
                    onEnded={restoreAmbient}
                  />
                )}

                <div className="npcdialogue-options">
                  {currentNode.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="npcdialogue-option"
                      disabled={option.requires_skill_check}
                      onClick={() => choose(option)}
                    >
                      <span>{option.label}</span>
                      {option.requires_skill_check && (
                        <span className="npcdialogue-option-check">
                          Teste de {option.skill ?? '?'} (CD {option.dc ?? '?'}) — rolagem ainda não
                          integrada a este fluxo
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="npcdialogue-error">Este NPC ainda não tem diálogo configurado.</p>
            )
          ) : groupLoading ? (
            <div className="npcdialogue-loading">
              <Spinner color="var(--color-primary)" size="medium" />
            </div>
          ) : groupError ? (
            <p className="npcdialogue-error">{groupError}</p>
          ) : groupEntries.length === 0 ? (
            <p className="npcdialogue-empty">Ninguém do grupo conversou com {npc.name} ainda.</p>
          ) : (
            <ul className="npcdialogue-group-list">
              {groupEntries.map((entry) => (
                <li key={entry.key} className="npcdialogue-group-entry">
                  <div className="npcdialogue-group-entry-header">
                    <span className="npcdialogue-group-entry-hero">{entry.heroName}</span>
                    <span className="npcdialogue-group-entry-date">{formatDateTime(entry.createdAt)}</span>
                  </div>
                  <p className="npcdialogue-group-entry-choice">{entry.optionLabel}</p>
                  {entry.npcResponseText && (
                    <p className="npcdialogue-group-entry-response">{entry.npcResponseText}</p>
                  )}
                  {entry.npcResponseAudioUrl && (
                    <button
                      type="button"
                      className="npcdialogue-group-entry-replay"
                      onClick={() => replay(entry.npcResponseAudioUrl as string)}
                    >
                      <span className="material-symbols-outlined">play_circle</span>
                      <span>Ouvir novamente</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <audio ref={replayAudioRef} />
      </div>
    </div>
  );
}
