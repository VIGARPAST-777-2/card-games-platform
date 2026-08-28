import type express from 'express';
import { getSupabase } from './supabase.js';

export type ProfileRow = {
  id: string;
  auth_user_id: string;
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
};

export async function authProfile(req: express.Request): Promise<ProfileRow | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  const sb = getSupabase();
  const { data: userData, error } = await sb.auth.getUser(token);
  if (error || !userData.user) return null;
  const { data: profile } = await sb
    .from('profiles')
    .select(
      'id, auth_user_id, username, avatar_url, level, xp, wins, losses, games_played, coins, gems, current_streak, best_streak, season_pass_xp, season_pass_premium, title'
    )
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();
  return (profile as ProfileRow) ?? null;
}

export function bearer(req: express.Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}
