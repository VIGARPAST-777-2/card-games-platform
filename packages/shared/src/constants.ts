import type { GameId, RankTier } from './types.js';

export const GAMES: Record<GameId, { name: string; minPlayers: number; maxPlayers: number }> = {
  poker: { name: 'Poker', minPlayers: 2, maxPlayers: 8 },
  blackjack: { name: 'Blackjack', minPlayers: 1, maxPlayers: 7 },
  rummy: { name: 'Rummy', minPlayers: 2, maxPlayers: 6 },
  hearts: { name: 'Hearts', minPlayers: 4, maxPlayers: 4 },
  spades: { name: 'Spades', minPlayers: 4, maxPlayers: 4 },
  tute: { name: 'Tute', minPlayers: 2, maxPlayers: 4 },
  mus: { name: 'Mus', minPlayers: 4, maxPlayers: 4 },
};

export const RANK_TIERS: RankTier[] = [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'master',
];

export const RANK_DIVISIONS = 3;

export const XP_PER_LEVEL = 1000;
export const XP_WIN_BASE = 50;
export const XP_LOSS_BASE = 15;

export const DISCONNECT_GRACE_MS = 60_000;
export const TURN_TIMEOUT_MS = 30_000;

export const BOT_LEVEL_RANGE = {
  min: 100,
  max: 3000,
};
