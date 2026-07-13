import { useSessionEventStream } from '../../../../../../hooks/useSessionEventStream';

export function useSceneEventsStream(
  sessionId: string | null | undefined,
  sceneId: string | null | undefined,
  onNotify: () => void
) {
  const streamPath = sessionId && sceneId ? `sessions/${sessionId}/scenes/${sceneId}/events/stream` : null;
  useSessionEventStream(streamPath, onNotify);
}
