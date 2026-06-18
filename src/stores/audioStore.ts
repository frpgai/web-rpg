import { create } from 'zustand';

interface AudioState {
  // Estado do mixer multi-camada.
  // Preenchido pelas specs de soundboard.
  masterVolume: number; // 0 a 1
  setMasterVolume: (volume: number) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  masterVolume: 1,
  setMasterVolume: (volume) => set({ masterVolume: Math.max(0, Math.min(1, volume)) }),
}));
