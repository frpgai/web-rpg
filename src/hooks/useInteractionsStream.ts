import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import type { DiceRollResult } from '../types/diceRoll';

const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? '';

export interface RollResolvedStreamPayload extends DiceRollResult {
  executor_user_id: string;
  executor_hero_id?: string | null;
}

export interface NarrativeStreamPayload {
  text: string;
  executor_user_id: string;
}

export interface SystemErrorStreamPayload {
  interaction_id: string;
  error: string;
  executor_user_id: string;
}

type Handlers = {
  onRollResolved: (payload: RollResolvedStreamPayload) => void;
  onNarrative: (payload: NarrativeStreamPayload) => void;
  onSystemError: (payload: SystemErrorStreamPayload) => void;
};

/**
 * Conecta ao stream SSE dedicado de resolução de interações
 * (`GET /api/v1/sessions/{sessionId}/interactions/stream`, be-rpg PR #82) e
 * despacha os eventos nomeados `roll_resolved`, `narrative` e `system_error`
 * para os handlers informados. Substitui a antiga emissão desses eventos via
 * `useSessionSocket` (WebSocket) — plano 00012-resolucao-imediata-narrativa,
 * item F.A. Não afeta o stream de log de eventos da cena
 * (`useSessionEventStream`, item F.B), que continua inalterado.
 */
export function useInteractionsStream(sessionId: string | null | undefined, handlers: Handlers) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!sessionId) return;

    const token = useAuthStore.getState().token;
    const sse = new EventSource(
      `${API_BASE_URL}/api/v1/sessions/${sessionId}/interactions/stream?token=${token}`
    );

    const onRollResolved = (message: MessageEvent) => {
      try {
        handlersRef.current.onRollResolved(JSON.parse(message.data));
      } catch (err) {
        console.error('Failed to parse roll_resolved event:', err);
      }
    };

    const onNarrative = (message: MessageEvent) => {
      try {
        handlersRef.current.onNarrative(JSON.parse(message.data));
      } catch (err) {
        console.error('Failed to parse narrative event:', err);
      }
    };

    const onSystemError = (message: MessageEvent) => {
      try {
        handlersRef.current.onSystemError(JSON.parse(message.data));
      } catch (err) {
        console.error('Failed to parse system_error event:', err);
      }
    };

    sse.addEventListener('roll_resolved', onRollResolved);
    sse.addEventListener('narrative', onNarrative);
    sse.addEventListener('system_error', onSystemError);

    sse.onerror = (err) => {
      console.error('Interactions stream error:', err);
    };

    return () => {
      sse.close();
    };
  }, [sessionId]);
}
