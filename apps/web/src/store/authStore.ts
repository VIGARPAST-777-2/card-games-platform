import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';

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

interface AuthState {
  ready: boolean;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  init: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ready: false,
  user: null,
  session: null,
  profile: null,

  init: async () => {
    const sb = await getSupabase();
    if (!sb) {
      set({ ready: true });
      return;
    }
    const { data } = await sb.auth.getSession();
    set({ session: data.session, user: data.session?.user ?? null, ready: true });
    if (data.session?.user) await get().refreshProfile();

    sb.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) await get().refreshProfile();
      else set({ profile: null });
    });
  },

  signUp: async (email, password, username) => {
    const sb = await getSupabase();
    if (!sb) return 'Supabase no configurado';
    const { error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return error?.message ?? null;
  },

  signIn: async (email, password) => {
    const sb = await getSupabase();
    if (!sb) return 'Supabase no configurado';
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  },

  signOut: async () => {
    const sb = await getSupabase();
    await sb?.auth.signOut();
    set({ user: null, session: null, profile: null });
  },

  refreshProfile: async () => {
    const sb = await getSupabase();
    const user = get().user;
    if (!sb || !user) return;
    const { data } = await sb
      .from('profiles')
      .select(
        'id, username, avatar_url, level, xp, wins, losses, games_played, coins, gems, current_streak, best_streak, season_pass_xp, season_pass_premium, title'
      )
      .eq('auth_user_id', user.id)
      .maybeSingle();
    if (data) set({ profile: data as Profile });
  },
}));
