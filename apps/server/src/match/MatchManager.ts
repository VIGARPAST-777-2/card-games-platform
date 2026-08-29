import type { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import type { ClientAction, MatchConfig, MatchState, Player, ServerEvent } from '@deckora/shared';
import { DISCONNECT_GRACE_MS } from '@deckora/shared';
import {
  applyAction,
  createTable,
  publicView,
  simpleBotAction,
  startHand,
  type PokerTable,
  type PokerAction,
} from '../poker/engine.js';

interface InternalMatch {
  state: MatchState;
  sockets: Map<string, string>;
  disconnectTimers: Map<string, NodeJS.Timeout>;
  poker?: PokerTable;
  startingChips: number;
}

export class MatchManager {
  private matches = new Map<string, InternalMatch>();
  private socketToPlayer = new Map<string, { matchId: string; playerId: string }>();

  constructor(private io: Server) {}

  handleAction(socket: Socket, action: ClientAction) {
    try {
      switch (action.type) {
        case 'match:join':
          this.joinMatch(socket, action.payload);
          break;
        case 'match:leave':
          this.leaveMatch(socket);
          break;
        case 'match:action':
          this.handleGameAction(socket, action.payload);
          break;
        case 'match:ready':
          this.tryStart(socket);
          break;
        default:
          this.emitToSocket(socket, {
            type: 'match:action_result',
            payload: { success: false, error: 'Unknown action' },
          });
      }
    } catch (err) {
      console.error('[MatchManager]', err);
      this.emitToSocket(socket, {
        type: 'match:action_result',
        payload: { success: false, error: 'Internal error' },
      });
    }
  }

  handleDisconnect(socket: Socket) {
    const ref = this.socketToPlayer.get(socket.id);
    if (!ref) return;
    const match = this.matches.get(ref.matchId);
    if (!match) return;
    const player = match.state.players.find((p) => p.id === ref.playerId);
    if (!player || player.isBot) return;

    player.status = 'disconnected';
    match.sockets.delete(ref.playerId);
    this.socketToPlayer.delete(socket.id);
    player.isBot = true;
    player.status = 'bot';

    this.broadcast(match, {
      type: 'match:player_disconnected',
      payload: { playerId: player.id, botTakeover: true },
    });
    this.broadcastState(match);
    this.maybeBotTurn(match);

    const timer = setTimeout(() => {
      match.disconnectTimers.delete(ref.playerId);
    }, DISCONNECT_GRACE_MS);
    match.disconnectTimers.set(ref.playerId, timer);
  }

  private joinMatch(
    socket: Socket,
    payload: {
      matchId?: string;
      code?: string;
      config?: Partial<MatchConfig>;
      username?: string;
      avatarUrl?: string;
    }
  ) {
    if (this.socketToPlayer.has(socket.id)) this.leaveMatch(socket);

    let match: InternalMatch | undefined;
    if (payload.matchId) match = this.matches.get(payload.matchId);
    else if (payload.code) {
      match = [...this.matches.values()].find((m) => m.state.config.privateCode === payload.code);
    }

    const mode = payload.config?.mode ?? 'quick';
    const maxPlayers = payload.config?.maxPlayers ?? (mode === 'bot' ? 4 : 6);

    if (!match) {
      const matchId = uuid();
      const config: MatchConfig = {
        gameId: 'poker',
        mode,
        maxPlayers,
        minPlayers: mode === 'bot' ? 2 : 2,
        privateCode: mode === 'private' ? this.generateCode() : undefined,
        ranked: mode === 'ranked',
      };
      const state: MatchState = {
        matchId,
        config,
        players: [],
        phase: 'waiting',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      match = {
        state,
        sockets: new Map(),
        disconnectTimers: new Map(),
        startingChips: mode === 'ranked' ? 1000 : 1500,
      };
      this.matches.set(matchId, match);

      if (mode === 'bot' || mode === 'friendly') {
        const bots = Math.min(3, maxPlayers - 1);
        for (let i = 0; i < bots; i++) {
          match.state.players.push({
            id: uuid(),
            username: `Bot ${i + 1}`,
            status: 'bot',
            isBot: true,
            botLevel: 1000 + i * 200,
            seat: i,
          });
        }
      }
    }

    if (match.state.players.filter((p) => !p.isBot || p.status === 'bot').length >= match.state.config.maxPlayers &&
        match.state.players.length >= match.state.config.maxPlayers) {
      // allow if seat free
    }
    if (match.state.players.length >= match.state.config.maxPlayers) {
      this.emitToSocket(socket, {
        type: 'match:action_result',
        payload: { success: false, error: 'Table full' },
      });
      return;
    }

    const playerId = uuid();
    const player: Player = {
      id: playerId,
      username: payload.username ?? `Player_${playerId.slice(0, 4)}`,
      avatarUrl: payload.avatarUrl,
      status: 'connected',
      isBot: false,
      seat: match.state.players.length,
    };
    match.state.players.push(player);
    match.state.updatedAt = Date.now();
    match.sockets.set(playerId, socket.id);
    this.socketToPlayer.set(socket.id, { matchId: match.state.matchId, playerId });
    socket.join(match.state.matchId);

    this.broadcast(match, { type: 'match:player_joined', payload: player });
    this.broadcastState(match);
    this.emitToSocket(socket, { type: 'match:action_result', payload: { success: true } });

    // auto-start bot/friendly when enough players
    if (
      match.state.phase === 'waiting' &&
      match.state.players.length >= match.state.config.minPlayers &&
      (mode === 'bot' || mode === 'friendly' || match.state.players.length >= match.state.config.maxPlayers)
    ) {
      this.beginPoker(match);
    }
  }

  private tryStart(socket: Socket) {
    const ref = this.socketToPlayer.get(socket.id);
    if (!ref) return;
    const match = this.matches.get(ref.matchId);
    if (!match || match.state.phase !== 'waiting') return;
    if (match.state.players.length < match.state.config.minPlayers) {
      this.emitToSocket(socket, {
        type: 'match:action_result',
        payload: { success: false, error: 'Need more players' },
      });
      return;
    }
    this.beginPoker(match);
  }

  private beginPoker(match: InternalMatch) {
    const seats = match.state.players.map((p, i) => ({
      playerId: p.id,
      username: p.username,
      chips: match.startingChips,
      isBot: p.isBot,
      seat: i,
    }));
    let table = createTable(seats);
    table = startHand(table);
    match.poker = table;
    match.state.phase = 'playing';
    match.state.updatedAt = Date.now();
    this.broadcastPoker(match);
    this.maybeBotTurn(match);
  }

  private leaveMatch(socket: Socket) {
    const ref = this.socketToPlayer.get(socket.id);
    if (!ref) return;
    const match = this.matches.get(ref.matchId);
    if (!match) return;
    match.state.players = match.state.players.filter((p) => p.id !== ref.playerId);
    match.sockets.delete(ref.playerId);
    this.socketToPlayer.delete(socket.id);
    socket.leave(match.state.matchId);
    this.broadcast(match, { type: 'match:player_left', payload: { playerId: ref.playerId } });
    if (match.state.players.length === 0) this.matches.delete(ref.matchId);
    else this.broadcastState(match);
  }

  private handleGameAction(socket: Socket, payload: { action: string; data?: unknown }) {
    const ref = this.socketToPlayer.get(socket.id);
    if (!ref) {
      this.emitToSocket(socket, {
        type: 'match:action_result',
        payload: { success: false, error: 'Not in a match' },
      });
      return;
    }
    const match = this.matches.get(ref.matchId);
    if (!match?.poker || match.state.phase !== 'playing') {
      this.emitToSocket(socket, {
        type: 'match:action_result',
        payload: { success: false, error: 'Match not active' },
      });
      return;
    }

    const action = payload.action as PokerAction;
    const raiseTo =
      typeof payload.data === 'object' && payload.data && 'raiseTo' in (payload.data as object)
        ? Number((payload.data as { raiseTo: number }).raiseTo)
        : undefined;

    const result = applyAction(match.poker, ref.playerId, action, raiseTo);
    if (!result.ok) {
      this.emitToSocket(socket, {
        type: 'match:action_result',
        payload: { success: false, error: result.error },
      });
      return;
    }
    match.poker = result.table;
    match.state.updatedAt = Date.now();
    this.emitToSocket(socket, { type: 'match:action_result', payload: { success: true } });
    this.broadcastPoker(match);

    if (match.poker.phase === 'finished') {
      // next hand after short delay if players have chips
      setTimeout(() => {
        if (!match.poker) return;
        const withChips = match.poker.seats.filter((s) => s.chips > 0);
        if (withChips.length >= 2) {
          match.poker.dealerIndex = (match.poker.dealerIndex + 1) % match.poker.seats.length;
          match.poker = startHand(match.poker);
          this.broadcastPoker(match);
          this.maybeBotTurn(match);
        } else {
          match.state.phase = 'finished';
          this.broadcastState(match);
        }
      }, 2500);
    } else {
      this.maybeBotTurn(match);
    }
  }

  private maybeBotTurn(match: InternalMatch) {
    if (!match.poker || match.poker.phase === 'finished' || match.poker.phase === 'waiting') return;
    const cur = match.poker.seats[match.poker.currentIndex];
    if (!cur || !cur.isBot || cur.folded || cur.allIn) return;

    setTimeout(() => {
      if (!match.poker) return;
      const still = match.poker.seats[match.poker.currentIndex];
      if (!still || still.playerId !== cur.playerId) return;
      const bot = simpleBotAction(match.poker, cur.playerId);
      const result = applyAction(match.poker, cur.playerId, bot.action, bot.raiseTo);
      if (result.ok) {
        match.poker = result.table;
        this.broadcastPoker(match);
        if (match.poker.phase === 'finished') {
          setTimeout(() => {
            if (!match.poker) return;
            if (match.poker.seats.filter((s) => s.chips > 0).length >= 2) {
              match.poker.dealerIndex = (match.poker.dealerIndex + 1) % match.poker.seats.length;
              match.poker = startHand(match.poker);
              this.broadcastPoker(match);
              this.maybeBotTurn(match);
            }
          }, 2500);
        } else {
          this.maybeBotTurn(match);
        }
      }
    }, 600 + Math.random() * 800);
  }

  private broadcastPoker(match: InternalMatch) {
    if (!match.poker) return;
    // each player gets personalized hole cards
    for (const [playerId, socketId] of match.sockets) {
      const sock = this.io.sockets.sockets.get(socketId);
      if (!sock) continue;
      sock.emit('event', {
        type: 'match:state',
        payload: {
          ...match.state,
          table: publicView(match.poker, playerId) as unknown as MatchState['table'],
        },
      });
    }
    // also broadcast generic for spectators via room without holes
    this.io.to(match.state.matchId).emit('poker:public', publicView(match.poker));
  }

  private broadcast(match: InternalMatch, event: ServerEvent) {
    this.io.to(match.state.matchId).emit('event', event);
  }

  private broadcastState(match: InternalMatch) {
    this.broadcast(match, { type: 'match:state', payload: match.state });
  }

  private emitToSocket(socket: Socket, event: ServerEvent) {
    socket.emit('event', event);
  }

  private generateCode(): string {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }
}
