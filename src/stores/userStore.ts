import { create } from 'zustand';
import type { User } from '../types/user';
import { userService } from '../api/services/userService';

interface UserState {
  user: User | null;
  loading: boolean;
  fetchMe: () => Promise<User>;
  setUser: (user: User) => void;
  setCurrentSystem: (id: string) => Promise<User>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,

  fetchMe: async () => {
    set({ loading: true });
    try {
      const user = await userService.getMe();
      set({ user, loading: false });
      return user;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  setUser: (user: User) => set({ user }),

  setCurrentSystem: async (id: string) => {
    const user = await userService.patchMe({ current_system_id: id });
    set({ user });
    return user;
  },

  clearUser: () => set({ user: null, loading: false }),
}));
