import type { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import type { ClientAction, MatchConfig, MatchState, Player, ServerEvent, PokerVariant } from '@deckora/shared';
import { DISCONNECT_GRACE_MS, ONLINE_MATCH_MS, matchmakingWindow } from '@deckora/shared';
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
  playerMmr: Map<string, number>;
  hostPlayerId?: string;
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
          this.handleReady(socket, (action as { payload?: { fillBots?: boolean } }).payload);
          break;
        case 'match:invite':
          this.handleInvite(socket, action.payload);
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

  /** Privada: el host decide cuándo empezar; opcionalmente rellena con bots */
  private handleReady(socket: Socket, payload?: { fillBots?: boolean }) {
    const ref = this.socketToPlayer.get(socket.id);
    if (!ref) return;
    const match = this.matches.get(ref.matchId);
    if (!match || match.state.phase !== 'waiting') return;
    if (match.state.config.mode !== 'private') return;
    if (match.hostPlayerId && match.hostPlayerId !== ref.playerId) {
      this.emitToSocket(socket, {
        type: 'match:action_result',
        payload: { success: false, error: 'Only host can start' },
      });
      return;
    }

    if (payload?.fillBots) {
      const need = match.state.config.targetPlayers - match.state.players.length;
      for (let i = 0; i < need; i++) {
        match.state.players.push({
          id: uuid(),
          username: `Bot ${i + 1}`,
          status: 'bot',
          isBot: true,
          seat: match.state.players.length,
          mmr: 800,
        });
      }
    }

    if (match.state.players.length < 2) {
      this.emitToSocket(socket, {
        type: 'match:action_result',
        payload: { success: false, error: 'Need at least 2 players (or fill with bots)' },
      });
      return;
    }

    this.beginPoker(match);
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

  private handleInvite(socket: Socket, payload: { username: string }) {
    const ref = this.socketToPlayer.get(socket.id);
    if (!ref) return;
    const match = this.matches.get(ref.matchId);
    if (!match || match.state.config.mode !== 'private') return;
    const from = match.state.players.find((p) => p.id === ref.playerId);
    this.io.emit('event', {
      type: 'match:invite',
      payload: {
        matchId: match.state.matchId,
        code: match.state.config.privateCode ?? '',
        from: from?.username ?? 'player',
        variant: match.state.config.variant,
        to: payload.username,
      },
    });
    this.emitToSocket(socket, { type: 'match:action_result', payload: { success: true } });
  }

  private joinMatch(
    socket: Socket,
    payload: {
      matchId?: string;
      code?: string;
      config?: Partial<MatchConfig>;
      username?: string;
      avatarUrl?: string;
      mmr?: number;
    }
  ) {
    if (this.socketToPlayer.has(socket.id)) this.leaveMatch(socket);

    const mode = payload.config?.mode === 'private' ? 'private' : 'online';
    const variant = (payload.config?.variant === 'omaha' ? 'omaha' : 'holdem') as PokerVariant;
    const targetPlayers = Math.min(
      9,
      Math.max(2, payload.config?.targetPlayers ?? payload.config?.maxPlayers ?? 6)
    );
    const durationMs = payload.config?.durationMs ?? ONLINE_MATCH_MS;
    const playerMmr = payload.mmr ?? 800;

    let match: InternalMatch | undefined;

    if (payload.matchId) match = this.matches.get(payload.matchId);
    else if (payload.code) {
      match = [...this.matches.values()].find(
        (m) => m.state.config.privateCode === payload.code && m.state.phase === 'waiting'
      );
    } else if (mode === 'online') {
      const window = matchmakingWindow(playerMmr);
      match = [...this.matches.values()].find((m) => {
        if (m.state.phase !== 'waiting') return false;
        if (m.state.config.mode !== 'online') return false;
        if (m.state.config.variant !== variant) return false;
        if (m.state.config.targetPlayers !== targetPlayers) return false;
        if (m.state.players.length >= targetPlayers) return false;
        const lobby = m.state.config.lobbyMmr ?? playerMmr;
        return Math.abs(lobby - playerMmr) <= window;
      });
    }

    if (!match) {
      const matchId = uuid();
      const config: MatchConfig = {
        gameId: 'poker',
        mode,
        variant,
        targetPlayers,
        maxPlayers: targetPlayers,
        minPlayers: mode === 'private' ? 2 : targetPlayers,
        durationMs,
        privateCode: mode === 'private' ? this.generateCode() : undefined,
        ranked: mode === 'online',
        lobbyMmr: playerMmr,
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
        startingChips: 1500,
        playerMmr: new Map(),
      };
      this.matches.set(matchId, match);
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
      mmr: playerMmr,
      seat: match.state.players.length,
    };
    match.state.players.push(player);
    if (match.state.players.length === 1) match.hostPlayerId = playerId;
    match.playerMmr.set(playerId, playerMmr);
    const mmrs = [...match.playerMmr.values()];
    match.state.config.lobbyMmr = Math.round(mmrs.reduce((a, b) => a + b, 0) / mmrs.length);
    match.state.updatedAt = Date.now();
    match.sockets.set(playerId, socket.id);
    this.socketToPlayer.set(socket.id, { matchId: match.state.matchId, playerId });
    socket.join(match.state.matchId);

    this.broadcast(match, { type: 'match:player_joined', payload: player });
    this.broadcastState(match);
    this.emitToSocket(socket, { type: 'match:action_result', payload: { success: true } });

    // Solo partida rapida: auto-start al llenar
    if (
      match.state.config.mode === 'online' &&
      match.state.players.length >= match.state.config.targetPlayers
    ) {
      this.beginPoker(match);
    }
  }

  private beginPoker(match: InternalMatch) {
    const holeCards = match.state.config.variant === 'omaha' ? 4 : 2;
    const seats = match.state.players.map((p, i) => ({
      playerId: p.id,
      username: p.username,
      chips: match.startingChips,
      isBot: p.isBot,
      seat: i,
    }));
    let table = createTable(seats);
    table = startHand(table, holeCards);
    match.poker = table;
    match.state.phase = 'playing';
    match.state.endsAt = Date.now() + match.state.config.durationMs;
    match.state.updatedAt = Date.now();
    this.broadcastPoker(match);
    this.maybeBotTurn(match);

    const remaining = match.state.config.durationMs;
    setTimeout(() => {
      if (match.state.phase === 'playing') {
        match.state.phase = 'finished';
        this.broadcastState(match);
      }
    }, remaining);
  }

  private leaveMatch(socket: Socket) {
    const ref = this.socketToPlayer.get(socket.id);
    if (!ref) return;
    const match = this.matches.get(ref.matchId);
    if (!match) return;
    match.state.players = match.state.players.filter((p) => p.id !== ref.playerId);
    match.playerMmr.delete(ref.playerId);
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
      setTimeout(() => {
        if (!match.poker) return;
        if (match.state.endsAt && Date.now() >= match.state.endsAt) {
          match.state.phase = 'finished';
          this.broadcastState(match);
          return;
        }
        if (match.poker.seats.filter((s) => s.chips > 0).length >= 2) {
          match.poker.dealerIndex = (match.poker.dealerIndex + 1) % match.poker.seats.length;
          const holes = match.state.config.variant === 'omaha' ? 4 : 2;
          match.poker = startHand(match.poker, holes);
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
        if (match.poker.phase !== 'finished') this.maybeBotTurn(match);
      }
    }, 600 + Math.random() * 800);
  }

  private broadcastPoker(match: InternalMatch) {
    if (!match.poker) return;
    for (const [playerId, socketId] of match.sockets) {
      const sock = this.io.sockets.sockets.get(socketId);
      if (!sock) continue;
      sock.emit('event', {
        type: 'match:state',
        payload: {
          ...match.state,
          table: publicView(match.poker, playerId),
        },
      });
    }
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
