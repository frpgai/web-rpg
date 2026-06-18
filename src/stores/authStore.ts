import { create } from 'zustand';
import { secureStorage } from '../utils/bridge';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setAuth: (token: string, user: User) => void;
  clearToken: () => void;
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}

const storedToken = secureStorage.getItem('jwt_token');
const initialToken = storedToken && !isTokenExpired(storedToken) ? storedToken : null;
if (storedToken && !initialToken) secureStorage.removeItem('jwt_token');

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  user: null,
  isAuthenticated: initialToken !== null,
  setToken: (token) => {
    secureStorage.setItem('jwt_token', token);
    set({ token, isAuthenticated: true });
  },
  setUser: (user) => set({ user }),
  setAuth: (token, user) => {
    secureStorage.setItem('jwt_token', token);
    set({ token, user, isAuthenticated: true });
  },
  clearToken: () => {
    secureStorage.removeItem('jwt_token');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
