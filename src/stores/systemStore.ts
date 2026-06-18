import { create } from 'zustand';
import type { System } from '../types';

interface SystemState {
  currentSystem: System | null;
  setCurrentSystem: (system: System | null) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  currentSystem: null,
  setCurrentSystem: (system) => set({ currentSystem: system }),
}));
