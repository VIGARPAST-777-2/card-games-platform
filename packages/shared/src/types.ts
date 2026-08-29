/** Tipos compartidos Deckora Poker */

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value?: number;
}

export type GameId = 'poker';

export type MatchMode = 'online' | 'private';

export type PokerVariant = 'holdem' | 'omaha';

export type PlayerStatus = 'connected' | 'disconnected' | 'bot' | 'spectating';

export interface Player {
  id: string;
  username: string;
  avatarUrl?: string;
  status: PlayerStatus;
  isBot: boolean;
  botLevel?: number;
  mmr?: number;
  hand?: Card[];
  seat: number;
}

export interface MatchConfig {
  gameId: GameId;
  mode: MatchMode;
  variant: PokerVariant;
  /** Jugadores necesarios para empezar */
  targetPlayers: number;
  maxPlayers: number;
  minPlayers: number;
  /** Duracion maxima de la sesion en ms */
  durationMs: number;
  privateCode?: string;
  ranked?: boolean;
  /** MMR medio de la sala (matchmaking) */
  lobbyMmr?: number;
}

export interface MatchState {
  matchId: string;
  config: MatchConfig;
  players: Player[];
  phase: 'waiting' | 'playing' | 'finished';
  currentTurn?: string;
  turnDeadline?: number;
  endsAt?: number;
  table?: unknown;
  winnerIds?: string[];
  createdAt: number;
  updatedAt: number;
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
  | { type: 'match:finished'; payload: { winnerIds: string[]; scores: Record<string, number> } }
  | { type: 'match:invite'; payload: { matchId: string; code: string; from: string; variant: PokerVariant } };

export type ClientAction =
  | {
      type: 'match:join';
      payload: {
        matchId?: string;
        code?: string;
        config?: Partial<MatchConfig>;
        username?: string;
        avatarUrl?: string;
        mmr?: number;
      };
    }
  | { type: 'match:leave' }
  | { type: 'match:action'; payload: { action: string; data?: unknown } }
  | { type: 'match:ready' }
  | { type: 'match:invite'; payload: { username: string } };
