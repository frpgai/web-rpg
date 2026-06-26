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
  kitId: string;
  abilitySlugs: string[];
  abilityIds: string[];
  skillIds: string[];

  // Actions
  reset: () => void;
  setAncestry: (a: Ancestry) => void;
  setCharacterClass: (v: StoredClass) => void;
  setBackground: (b: Background) => void;
  setName: (n: string) => void;
  setBackstory: (b: string) => void;
  setAvatarUrl: (url: string) => void;
  setAvatar: (id: string, url: string) => void;
  setKit: (id: string, slug: string) => void;
  toggleAbility: (id: string, slug: string) => void;
  toggleSkill: (id: string, limit: number) => void;
  setBackgroundSkillIds: (ids: string[]) => void;
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
  kitId: '',
  abilitySlugs: [] as string[],
  abilityIds: [] as string[],
  skillIds: [] as string[],
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

  setKit: (id, slug) => set({ kitId: id, kitSlug: slug }),

  toggleAbility: (id, slug) =>
    set((state) => {
      const currentSlugs = state.abilitySlugs;
      const currentIds = state.abilityIds;
      if (currentSlugs.includes(slug)) {
        return {
          abilitySlugs: currentSlugs.filter((s) => s !== slug),
          abilityIds: currentIds.filter((i) => i !== id),
        };
      }
      if (currentSlugs.length >= 2) return {};
      return {
        abilitySlugs: [...currentSlugs, slug],
        abilityIds: [...currentIds, id],
      };
    }),

  toggleSkill: (id, limit) =>
    set((state) => {
      const current = state.skillIds;
      if (current.includes(id)) {
        return { skillIds: current.filter((i) => i !== id) };
      }
      if (current.length >= limit) return {};
      return { skillIds: [...current, id] };
    }),

  setBackgroundSkillIds: (ids) => set({ skillIds: ids }),
}));
