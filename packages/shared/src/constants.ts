import type { RankTier } from './types.js';

export type PokerVariant = 'holdem' | 'omaha';

export const POKER_VARIANTS: Record<
  PokerVariant,
  { nameEs: string; nameEn: string; nameFr: string; holeCards: number }
> = {
  holdem: {
    nameEs: 'Texas Hold\'em',
    nameEn: 'Texas Hold\'em',
    nameFr: 'Texas Hold\'em',
    holeCards: 2,
  },
  omaha: {
    nameEs: 'Omaha',
    nameEn: 'Omaha',
    nameFr: 'Omaha',
    holeCards: 4,
  },
};

/** Recomendado: más jugado y más rápido de llenar */
export const RECOMMENDED = {
  variant: 'holdem' as PokerVariant,
  tableSize: 6,
  reasonEs: 'Mas jugado y salas mas rapidas',
  reasonEn: 'Most played and fastest lobbies',
  reasonFr: 'Le plus joue et lobbies plus rapides',
};

export const TABLE_SIZES = [2, 4, 6, 8, 9] as const;

/** Partidas online normales: 10 minutos */
export const ONLINE_MATCH_MS = 10 * 60 * 1000;

export const PRIVATE_TIME_OPTIONS_MIN = [5, 10, 15, 20, 30] as const;

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
export const DISCONNECT_GRACE_MS = 60_000;
export const TURN_TIMEOUT_MS = 30_000;

export const DEFAULT_STARTING_MMR = 800;
