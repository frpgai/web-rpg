import { useRef } from 'react';
import { getAssetUrl } from '../../../utils/url';
import { useAudioStore } from '../../../stores/audioStore';
import { Spinner } from '../../../components/ui/Spinner';
import { useNpcDialogue } from './useNpcDialogue';
import type { SceneNPC } from '../../../types';
import './NPCDialogueModal.css';

type Props = {
  sessionId: string;
  npc: SceneNPC;
  onClose: () => void;
  onEventLogged: () => void;
};

export function NPCDialogueModal({ sessionId, npc, onClose, onEventLogged }: Props) {
  const { currentNode, loading, error, choose } = useNpcDialogue(sessionId, npc, onEventLogged);
  const duckAmbient = useAudioStore((s) => s.duckAmbient);
  const restoreAmbient = useAudioStore((s) => s.restoreAmbient);
  const voiceAudioRef = useRef<HTMLAudioElement>(null);

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

        <div className="npcdialogue-body">
          {loading ? (
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
          )}
        </div>
      </div>
    </div>
  );
}
