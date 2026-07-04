import { create } from 'zustand';

// Fator de "ducking" da trilha ambiente (capítulo/cena) enquanto a voz de um
// NPC está tocando — reduz 60% do volume, ou seja, cai para 40% (spec A00153
// seção 5). Consumido pela trilha ambiente da StorytellingScreen/TimelineFeed
// e disparado pelo NPCDialogueModal ao tocar/parar o áudio de voz do NPC.
const DUCKED_AMBIENT_FACTOR = 0.4;
const NORMAL_AMBIENT_FACTOR = 1;

interface AudioState {
  // Estado do mixer multi-camada.
  // Preenchido pelas specs de soundboard.
  masterVolume: number; // 0 a 1
  setMasterVolume: (volume: number) => void;

  // Fator de ducking aplicado à trilha ambiente (0 a 1), multiplicado pelo
  // masterVolume por quem consome o valor.
  ambientDuckFactor: number;
  duckAmbient: () => void;
  restoreAmbient: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  masterVolume: 1,
  setMasterVolume: (volume) => set({ masterVolume: Math.max(0, Math.min(1, volume)) }),

  ambientDuckFactor: NORMAL_AMBIENT_FACTOR,
  duckAmbient: () => set({ ambientDuckFactor: DUCKED_AMBIENT_FACTOR }),
  restoreAmbient: () => set({ ambientDuckFactor: NORMAL_AMBIENT_FACTOR }),
}));
