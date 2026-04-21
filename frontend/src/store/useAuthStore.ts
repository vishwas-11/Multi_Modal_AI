'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';
import { setToken, removeToken } from '@/lib/auth';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      setUser: (user, token) => {
        setToken(token);
        set({ user, token, error: null });
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.login(email, password);
          const { user, token } = res.data.data;
          setToken(token);
          set({ user, token, isLoading: false });
        } catch (err: unknown) {
          const e = err as { displayMessage?: string };
          set({ error: e.displayMessage || 'Login failed', isLoading: false });
          throw err;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.register(name, email, password);
          const { user, token } = res.data.data;
          setToken(token);
          set({ user, token, isLoading: false });
        } catch (err: unknown) {
          const e = err as { displayMessage?: string };
          set({ error: e.displayMessage || 'Registration failed', isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try { await authApi.logout(); } catch { /* ignore */ }
        removeToken();
        set({ user: null, token: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);