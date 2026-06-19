import { create } from 'zustand';
import type { Ancestry, Background, CharacterClass, Vocation, HeroAttributes } from '../types';
import { POINT_BUY_BUDGET, POINT_BUY_COST } from '../constants/rules';

/** The class/vocation stored during hero creation. May be CharacterClass (legacy) or Vocation (new). */
export type StoredClass = CharacterClass | Vocation;

type HeroCreationState = {
  // Step 1
  ancestry: Ancestry | null;
  characterClass: StoredClass | null;
  background: Background | null;
  asiPlus2: string | null;   // atributo que recebe +2 (chave interna: 'str','dex',...)
  asiPlus1: string | null;   // atributo que recebe +1 (deve ser diferente de asiPlus2)
  asiAllPlus1: boolean;      // Opção B: distribui +1/+1/+1 igualmente
  // Step 2
  baseAttributes: HeroAttributes;
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
  setBaseAttributes: (attrs: HeroAttributes) => void;
  setAttribute: (key: keyof HeroAttributes, value: number) => void;
  rollAttributes: () => void;
  setName: (n: string) => void;
  setBackstory: (b: string) => void;
  setAvatarUrl: (url: string) => void;
  setAvatar: (id: string, url: string) => void;
  setKit: (slug: string) => void;
  toggleAbility: (slug: string) => void;
  setAsiPlus2: (attr: string | null) => void;
  setAsiPlus1: (attr: string | null) => void;
  setAsiAllPlus1: (val: boolean) => void;
};

const defaultAttributes: HeroAttributes = {
  str: 8,
  dex: 8,
  con: 8,
  int: 8,
  wis: 8,
  cha: 8,
};

const defaultState = {
  ancestry: null,
  characterClass: null,
  background: null,
  asiPlus2: null,
  asiPlus1: null,
  asiAllPlus1: false,
  baseAttributes: defaultAttributes,
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

  setBaseAttributes: (baseAttributes) => set({ baseAttributes }),

  setAttribute: (key, value) =>
    set((state) => ({
      baseAttributes: { ...state.baseAttributes, [key]: value },
    })),

  rollAttributes: () => {
    const KEYS: (keyof HeroAttributes)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const MAX_RETRIES = 100;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const attrs: HeroAttributes = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
      let remaining = POINT_BUY_BUDGET;
      const shuffled = [...KEYS].sort(() => Math.random() - 0.5);

      let valid = true;
      for (let i = 0; i < shuffled.length; i++) {
        const key = shuffled[i];
        const isLast = i === shuffled.length - 1;

        if (isLast) {
          const target = Object.entries(POINT_BUY_COST).find(([, cost]) => cost === remaining);
          if (!target) {
            valid = false;
            break;
          }
          attrs[key] = Number(target[0]);
          remaining = 0;
        } else {
          const affordable = Object.entries(POINT_BUY_COST)
            .filter(([v, cost]) => Number(v) >= 8 && cost <= remaining)
            .map(([v]) => Number(v));
          if (affordable.length === 0) {
            valid = false;
            break;
          }
          const pick = affordable[Math.floor(Math.random() * affordable.length)];
          attrs[key] = pick;
          remaining -= POINT_BUY_COST[pick];
        }
      }

      if (valid && remaining === 0) {
        set({ baseAttributes: attrs });
        return;
      }
    }

    // Fallback: balanced spread
    set({ baseAttributes: { str: 13, dex: 13, con: 13, int: 12, wis: 10, cha: 10 } });
  },

  setName: (name) => set({ name }),

  setBackstory: (backstory) => set({ backstory }),

  setAvatarUrl: (avatarUrl) => set({ avatarUrl }),

  setAvatar: (avatarId, avatarUrl) => set({ avatarId, avatarUrl }),

  setKit: (kitSlug) => set({ kitSlug }),

  setAsiPlus2: (asiPlus2) => set({ asiPlus2 }),

  setAsiPlus1: (asiPlus1) => set({ asiPlus1 }),

  setAsiAllPlus1: (asiAllPlus1) => set({ asiAllPlus1 }),

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
