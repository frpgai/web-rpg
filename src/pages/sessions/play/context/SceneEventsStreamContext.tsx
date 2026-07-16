import { createContext, useContext } from 'react';

/**
 * Repassa o "tick" do único canal SSE de eventos de cena, assinado uma vez
 * em `PlayLayout` via `useSessionEventsNotify`, para consumidores aninhados
 * (ex: `useScenePhase`) — evita abrir uma segunda conexão `EventSource`
 * para o mesmo path `sessions/{id}/scenes/{sceneId}/events/stream`.
 */
export const SceneEventsStreamContext = createContext(0);

export function useSceneEventsStreamTick() {
  return useContext(SceneEventsStreamContext);
}
