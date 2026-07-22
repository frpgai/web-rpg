import { create } from 'zustand';

// Global "is any API request in flight" indicator. Driven entirely by the
// apiClient hooks (see api/client.ts) — pages never call increment/decrement
// directly, they just read isLoading (count > 0) if they want to react to it.
interface LoadingState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}));
