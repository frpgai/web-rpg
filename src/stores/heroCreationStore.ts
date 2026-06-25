import { create } from 'zustand';
import type { Ancestry, Background, CharacterClass, Vocation } from '../types';

/** The class/vocation stored during hero creation. May be CharacterClass (legacy) or Vocation (new). */
export type StoredClass = CharacterClass | Vocation;

type HeroCreationState = {
  // Step 1
  ancestry: Ancestry | null;
  characterClass: StoredClass | null;
  background: Background | null;
  // Step 3
  name: string;
  backstory: string;
  avatarId: string;
  avatarUrl: string;
  // Step 4
  kitSlug: string;
  abilitySlugs: string[];

  // Actions
  reset: () => void;
  setAncestry: (a: Ancestry) => void;
  setCharacterClass: (v: StoredClass) => void;
  setBackground: (b: Background) => void;
  setName: (n: string) => void;
  setBackstory: (b: string) => void;
  setAvatarUrl: (url: string) => void;
  setAvatar: (id: string, url: string) => void;
  setKit: (slug: string) => void;
  toggleAbility: (slug: string) => void;
};

const defaultState = {
  ancestry: null,
  characterClass: null,
  background: null,
  name: '',
  backstory: '',
  avatarId: '',
  avatarUrl: '',
  kitSlug: '',
  abilitySlugs: [] as string[],
};

export const useHeroCreationStore = create<HeroCreationState>((set) => ({
  ...defaultState,

  reset: () => set(defaultState),

  setAncestry: (ancestry) => set({ ancestry }),

  setCharacterClass: (characterClass) => set({ characterClass }),

  setBackground: (background) => set({ background }),

  setName: (name) => set({ name }),

  setBackstory: (backstory) => set({ backstory }),

  setAvatarUrl: (avatarUrl) => set({ avatarUrl }),

  setAvatar: (avatarId, avatarUrl) => set({ avatarId, avatarUrl }),

  setKit: (kitSlug) => set({ kitSlug }),

  toggleAbility: (slug) =>
    set((state) => {
      const current = state.abilitySlugs;
      if (current.includes(slug)) {
        return { abilitySlugs: current.filter((s) => s !== slug) };
      }
      if (current.length >= 2) return {};
      return { abilitySlugs: [...current, slug] };
    }),
}));
