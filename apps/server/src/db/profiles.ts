import { getSupabase } from './supabase.js';

export interface ProfileRow {
  id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  wins: number;
  losses: number;
  games_played: number;
  max_streak: number;
}

export async function getProfileByUsername(username: string): Promise<ProfileRow | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('profiles')
    .select('id, username, avatar_url, level, xp, wins, losses, games_played, max_streak')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('[db] getProfileByUsername', error.message);
    return null;
  }
  return data;
}

export async function ensureProfile(username: string): Promise<ProfileRow | null> {
  const existing = await getProfileByUsername(username);
  if (existing) return existing;

  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('profiles')
    .insert({ username })
    .select('id, username, avatar_url, level, xp, wins, losses, games_played, max_streak')
    .single();

  if (error) {
    console.error('[db] ensureProfile', error.message);
    return null;
  }
  return data;
}

export async function listRanks(profileId: string) {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('player_ranks')
    .select('game_id, mmr, tier, division')
    .eq('profile_id', profileId);

  if (error) {
    console.error('[db] listRanks', error.message);
    return [];
  }
  return data ?? [];
}
