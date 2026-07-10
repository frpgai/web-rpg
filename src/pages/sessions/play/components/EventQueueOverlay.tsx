import { useEffect, useState } from 'react';
import { DiceGrid } from '../../../../components/dice/DiceGrid';
import { TypewriterText } from '../phases/scene/TypewriterText';
import type { SessionEvent } from '../../../../types';
import './EventQueueOverlay.css';

type Props = {
  queue: SessionEvent[];
  onEventResolved: (eventId: string) => void;
  onExhausted: () => void;
};

function extractText(event: SessionEvent): string {
  const payload = event.payload as Record<string, unknown> | null;
  if (payload && typeof payload === 'object') {
    const candidate = payload.text ?? payload.label ?? payload.message;
    if (typeof candidate === 'string') return candidate;
  }
  if (event.choice_text) return event.choice_text;
  return event.type;
}

const ROLL_ANIMATION_MS = 1200;

/**
 * Overlay imersivo glassmorphic que processa sequencialmente a fila de
 * eventos não revelados do BottomSheet (spec fluxo passo 5): um evento por
 * vez, cobrindo o `SessionEventsSheet` com foco visual.
 *
 * - `dice_roll` (e `poi_investigation`/`scene_investigation`, que reusam o
 *   mesmo shape de rolagem):
 *   anima os dados rolando via `DiceGrid` (reaproveitado de
 *   `components/dice/`) antes de revelar o resultado.
 * - Demais tipos (narrativa/NPC): retrato + `TypewriterText` (reaproveitado
 *   de `phases/scene/TypewriterText.tsx`).
 *
 * "Continuar" fecha o evento atual e avança; ao esgotar a fila, chama
 * `onExhausted`. Não há endpoint dedicado de "marcar como revelado" no
 * backend (be-rpg PR #75 documenta reveal implícito na própria leitura de
 * `GET .../events`, já feita por `SessionEventsSheet` ao carregar) — este
 * overlay só reflete o estado revelado localmente.
 */
export function EventQueueOverlay({ queue, onEventResolved, onExhausted }: Props) {
  const [index, setIndex] = useState(0);
  const [rolling, setRolling] = useState(true);

  const event = queue[index];

  useEffect(() => {
    if (!event) return;
    if (event.type !== 'dice_roll' && event.type !== 'poi_investigation' && event.type !== 'scene_investigation')
      return;
    setRolling(true);
    const t = setTimeout(() => setRolling(false), ROLL_ANIMATION_MS);
    return () => clearTimeout(t);
  }, [event?.id]);

  if (!event) return null;

  const isRoll =
    event.type === 'dice_roll' || event.type === 'poi_investigation' || event.type === 'scene_investigation';

  function handleContinue() {
    onEventResolved(event.id);
    if (index + 1 >= queue.length) {
      onExhausted();
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="eventqueueoverlay-root" role="dialog" aria-modal="true">
      <div className="eventqueueoverlay-panel">
        {isRoll ? (
          <>
            <span className="eventqueueoverlay-label">{event.skill_check ?? 'Rolagem de Dados'}</span>
            <div className="eventqueueoverlay-dice-area">
              <DiceGrid type="d20" rolls={[event.roll ?? 10]} rolling={rolling} rollType="normal" />
            </div>
            {!rolling && (
              <>
                <div className="eventqueueoverlay-calc">
                  <span>{event.roll ?? '?'}</span>
                  <span>
                    {(event.modifier ?? 0) >= 0 ? '+' : ''}
                    {event.modifier ?? 0}
                  </span>
                  <span>=</span>
                  <span className="eventqueueoverlay-total">{event.total ?? '?'}</span>
                </div>
                {event.success != null && (
                  <span
                    className={`eventqueueoverlay-result ${
                      event.success
                        ? 'eventqueueoverlay-result-success'
                        : 'eventqueueoverlay-result-failure'
                    }`}
                  >
                    {event.success ? 'Sucesso' : 'Falha'}
                  </span>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <div className="eventqueueoverlay-portrait">
              <span className="material-symbols-outlined">psychiatry</span>
            </div>
            <p className="eventqueueoverlay-text">
              <TypewriterText text={extractText(event)} />
            </p>
          </>
        )}

        {(!isRoll || !rolling) && (
          <button type="button" className="eventqueueoverlay-continue" onClick={handleContinue}>
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}
