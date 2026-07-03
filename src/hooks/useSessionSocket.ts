import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import type { SessionSocketEvent } from '../types';

/**
 * Conecta automaticamente ao WebSocket da sessão e notifica o chamador
 * a cada evento recebido. Usado pelo Lobby (para saber quando a sessão
 * inicia) e pela Mesa de Jogo / Timeline (para atualizar a timeline ao vivo).
 */
export function useSessionSocket(sessionId: string, onEvent: (event: SessionSocketEvent) => void) {
  const token = useAuthStore((s) => s.token);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!sessionId || !token) return;

    const apiBase: string = import.meta.env.VITE_API_URL ?? '';
    const wsBase = apiBase.replace(/^http/, 'ws');
    const url = `${wsBase}/api/v1/sessions/${sessionId}/ws?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(url);

    socket.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data) as SessionSocketEvent;
        onEventRef.current(data);
      } catch (err) {
        console.error('Failed to parse session socket event:', err);
      }
    };

    socket.onerror = (err) => {
      console.error('Session socket error:', err);
    };

    return () => {
      socket.close();
    };
  }, [sessionId, token]);
}
