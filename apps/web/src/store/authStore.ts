import { create } from 'zustand';
import { api, getToken, setToken } from '../lib/api';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  wins: number;
  losses: number;
  games_played: number;
  coins: number;
  gems: number;
  current_streak: number;
  best_streak: number;
  season_pass_xp: number;
  season_pass_premium: boolean;
  title: string | null;
}

interface AuthUser {
  id: string;
  email?: string;
}

interface AuthState {
  ready: boolean;
  user: AuthUser | null;
  profile: Profile | null;
  init: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  ready: false,
  user: null,
  profile: null,

  init: async () => {
    const token = getToken();
    if (!token) {
      set({ ready: true, user: null, profile: null });
      return;
    }
    const { ok, data } = await api<{ user?: AuthUser; profile?: Profile }>('/api/auth/me');
    if (ok && data.user) {
      set({ user: data.user, profile: data.profile ?? null, ready: true });
    } else {
      setToken(null);
      set({ user: null, profile: null, ready: true });
    }
  },

  signUp: async (email, password, username) => {
    const { ok, data } = await api<{
      error?: string;
      access_token?: string;
      user?: AuthUser;
      profile?: Profile;
    }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });
    if (!ok) return data.error ?? 'Error de registro';
    if (data.access_token) {
      setToken(data.access_token);
      set({ user: data.user ?? null, profile: data.profile ?? null });
    }
    return null;
  },

  signIn: async (email, password) => {
    const { ok, data } = await api<{
      error?: string;
      access_token?: string;
      user?: AuthUser;
      profile?: Profile;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!ok) return data.error ?? 'Error de login';
    if (data.access_token) {
      setToken(data.access_token);
      set({ user: data.user ?? null, profile: data.profile ?? null });
    }
    return null;
  },

  signOut: async () => {
    await api('/api/auth/logout', { method: 'POST' });
    setToken(null);
    set({ user: null, profile: null });
  },

  refreshProfile: async () => {
    if (!getToken()) return;
    const { ok, data } = await api<{ profile?: Profile }>('/api/auth/me');
    if (ok && data.profile) set({ profile: data.profile });
  },
}));
