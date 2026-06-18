import { create } from 'zustand';

interface GameState {
  // Estado da sessão de jogo ativa.
  // Preenchido pelas specs da tela de campanha/jogo.
  activeCampaignId: string | null;
  setActiveCampaignId: (id: string | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  activeCampaignId: null,
  setActiveCampaignId: (id) => set({ activeCampaignId: id }),
}));
