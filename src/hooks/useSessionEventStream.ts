import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? '';

/**
 * Assina um canal SSE de notificação da sessão (padrão `event: notify\ndata: {}\n\n`,
 * ex: be-rpg PR #75 `.../events/stream` e PR #79 `.../players/stream`) e chama
 * `onNotify` a cada mensagem recebida. `path` é relativo a `/api/v1` e já deve
 * incluir os ids necessários (ex: `sessions/{id}/scenes/{sceneId}/events/stream`).
 * Passe `path` como `null`/`undefined` para desabilitar a assinatura (ex:
 * enquanto um id dependente ainda não está disponível).
 */
export function useSessionEventStream(path: string | null | undefined, onNotify: () => void) {
  useEffect(() => {
    if (!path) return;

    const token = useAuthStore.getState().token;
    const sse = new EventSource(`${API_BASE_URL}/api/v1/${path}${path.includes('?') ? '&' : '?'}token=${token}`);

    sse.addEventListener('notify', onNotify);

    return () => {
      sse.close();
    };
  }, [path, onNotify]);
}
