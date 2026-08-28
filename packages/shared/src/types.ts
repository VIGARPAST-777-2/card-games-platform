/** Tipos compartidos de Deckora */

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value?: number; // valor numérico según juego
}

export type GameId = 'poker' | 'blackjack' | 'rummy' | 'hearts' | 'spades' | 'tute' | 'mus';

export type MatchMode =
  | 'bot'
  | 'quick'
  | 'friendly'
  | 'private'
  | 'ranked';

export type PlayerStatus = 'connected' | 'disconnected' | 'bot' | 'spectating';

export interface Player {
  id: string;
  username: string;
  avatarUrl?: string;
  status: PlayerStatus;
  isBot: boolean;
  botLevel?: number; // 0-3000 approx MMR
  hand?: Card[];
  seat: number;
}

export interface MatchConfig {
  gameId: GameId;
  mode: MatchMode;
  maxPlayers: number;
  minPlayers: number;
  privateCode?: string;
  customRules?: Record<string, unknown>;
  ranked?: boolean;
}

export interface MatchState {
  matchId: string;
  config: MatchConfig;
  players: Player[];
  phase: 'waiting' | 'playing' | 'finished';
  currentTurn?: string; // playerId
  turnDeadline?: number; // timestamp
  deck?: Card[];
  discard?: Card[];
  table?: Card[];
  scores?: Record<string, number>;
  winnerIds?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  stats: {
    wins: number;
    losses: number;
    gamesPlayed: number;
    maxStreak: number;
  };
  ranks: Partial<Record<GameId, {
    tier: RankTier;
    division: number;
    mmr: number;
  }>>;
  cosmetics: {
    cardBack?: string;
    tableTheme?: string;
    avatarFrame?: string;
    title?: string;
  };
  achievements: string[];
}

export type RankTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master';

export type ServerEvent =
  | { type: 'match:state'; payload: MatchState }
  | { type: 'match:player_joined'; payload: Player }
  | { type: 'match:player_left'; payload: { playerId: string } }
  | { type: 'match:player_disconnected'; payload: { playerId: string; botTakeover: boolean } }
  | { type: 'match:player_reconnected'; payload: { playerId: string } }
  | { type: 'match:turn'; payload: { playerId: string; deadline: number } }
  | { type: 'match:action_result'; payload: { success: boolean; error?: string } }
  | { type: 'match:finished'; payload: { winnerIds: string[]; scores: Record<string, number> } };

export type ClientAction =
  | { type: 'match:join'; payload: { matchId?: string; code?: string; config?: Partial<MatchConfig> } }
  | { type: 'match:leave' }
  | { type: 'match:action'; payload: { action: string; data?: unknown } }
  | { type: 'match:ready' };
