import { useEffect, type RefObject } from 'react';
import { useAudioStore } from '../stores/audioStore';

/**
 * Aplica o `masterVolume` e o `ambientDuckFactor` (efeito de ducking do
 * diálogo de NPC — spec A00153 seção 5) ao elemento <audio> de trilha
 * ambiente informado, sempre que qualquer um dos dois mudar.
 */
export function useAmbientVolume(audioRef: RefObject<HTMLAudioElement | null>) {
  const masterVolume = useAudioStore((s) => s.masterVolume);
  const ambientDuckFactor = useAudioStore((s) => s.ambientDuckFactor);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, masterVolume * ambientDuckFactor));
  }, [audioRef, masterVolume, ambientDuckFactor]);
}
