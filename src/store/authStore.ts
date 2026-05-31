import type { User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { authService } from '@/services/authService';

type AuthState = {
  user: User | null;
  loading: boolean;
  bootstrapped: boolean;
  bootstrap: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  bootstrapped: false,

  async bootstrap() {
    const {
      data: { user },
    } = await authService.getCurrentUser();

    set({ user: user ?? null, bootstrapped: true });

    authService.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user ?? null, bootstrapped: true });
    });
  },

  async signIn(email, password) {
    set({ loading: true });
    try {
      const { user } = await authService.signIn(email, password);
      set({ user: user ?? null });
    } finally {
      set({ loading: false });
    }
  },

  async signUp(email, password, displayName) {
    set({ loading: true });
    try {
      const { user } = await authService.signUp(email, password, displayName);
      set({ user: user ?? null });
    } finally {
      set({ loading: false });
    }
  },

  async signOut() {
    set({ loading: true });
    try {
      await authService.signOut();
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },
}));
