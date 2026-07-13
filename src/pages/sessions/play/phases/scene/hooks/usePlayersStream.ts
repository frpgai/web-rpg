import { useSessionEventStream } from '../../../../../../hooks/useSessionEventStream';

export function usePlayersStream(
  sessionId: string | null | undefined,
  onNotify: () => void
) {
  const streamPath = sessionId ? `sessions/${sessionId}/players/stream` : null;
  useSessionEventStream(streamPath, onNotify);
}
