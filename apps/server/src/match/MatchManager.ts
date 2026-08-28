import type { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import type {
  ClientAction,
  MatchConfig,
  MatchState,
  Player,
  ServerEvent,
} from '@deckora/shared';
import { DISCONNECT_GRACE_MS } from '@deckora/shared';
import { createBotPlayer } from '../bots/BotPlayer.js';

interface InternalMatch {
  state: MatchState;
  sockets: Map<string, string>; // playerId -> socketId
  disconnectTimers: Map<string, NodeJS.Timeout>;
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
          // TODO: marcar listo y empezar cuando todos estén
          break;
        default:
          this.emitToSocket(socket, {
            type: 'match:action_result',
            payload: { success: false, error: 'Acción desconocida' },
          });
      }
    } catch (err) {
      console.error('[MatchManager]', err);
      this.emitToSocket(socket, {
        type: 'match:action_result',
        payload: { success: false, error: 'Error interno' },
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

    // Bot temporal toma el control
    const bot = createBotPlayer(player, match.state.players.length);
    // Reemplazamos temporalmente (mantenemos el mismo seat e id para reconexión)
    player.isBot = true;
    player.status = 'bot';
    player.botLevel = bot.botLevel;

    this.broadcast(match, {
      type: 'match:player_disconnected',
      payload: { playerId: player.id, botTakeover: true },
    });
    this.broadcastState(match);

    // Timer de gracia: si no vuelve, se queda como bot o se abandona
    const timer = setTimeout(() => {
      match.disconnectTimers.delete(ref.playerId);
      // Por ahora dejamos el bot permanente. Más adelante: abandon + ajuste de ranking.
      console.log(`[match] ${player.username} no reconectó, bot permanente`);
    }, DISCONNECT_GRACE_MS);

    match.disconnectTimers.set(ref.playerId, timer);
  }

  private joinMatch(
    socket: Socket,
    payload: { matchId?: string; code?: string; config?: Partial<MatchConfig> }
  ) {
    // Si ya está en una partida, salir primero
    if (this.socketToPlayer.has(socket.id)) {
      this.leaveMatch(socket);
    }

    let match: InternalMatch | undefined;

    if (payload.matchId) {
      match = this.matches.get(payload.matchId);
    } else if (payload.code) {
      match = [...this.matches.values()].find(
        (m) => m.state.config.privateCode === payload.code
      );
    }

    if (!match) {
      // Crear nueva partida
      const matchId = uuid();
      const config: MatchConfig = {
        gameId: payload.config?.gameId ?? 'poker',
        mode: payload.config?.mode ?? 'quick',
        maxPlayers: payload.config?.maxPlayers ?? 4,
        minPlayers: payload.config?.minPlayers ?? 2,
        privateCode: payload.config?.mode === 'private' ? this.generateCode() : undefined,
        ranked: payload.config?.mode === 'ranked',
        customRules: payload.config?.customRules,
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
      };
      this.matches.set(matchId, match);
    }

    if (match.state.players.length >= match.state.config.maxPlayers) {
      this.emitToSocket(socket, {
        type: 'match:action_result',
        payload: { success: false, error: 'Partida llena' },
      });
      return;
    }

    // Reconexión: si el jugador ya estaba (por id de sesión futura)
    // Por ahora siempre creamos nuevo jugador
    const playerId = uuid();
    const player: Player = {
      id: playerId,
      username: `Jugador_${playerId.slice(0, 4)}`,
      status: 'connected',
      isBot: false,
      seat: match.state.players.length,
    };

    match.state.players.push(player);
    match.state.updatedAt = Date.now();
    match.sockets.set(playerId, socket.id);
    this.socketToPlayer.set(socket.id, { matchId: match.state.matchId, playerId });

    socket.join(match.state.matchId);

    this.broadcast(match, {
      type: 'match:player_joined',
      payload: player,
    });
    this.broadcastState(match);

    this.emitToSocket(socket, {
      type: 'match:action_result',
      payload: { success: true },
    });
  }

  private leaveMatch(socket: Socket) {
    const ref = this.socketToPlayer.get(socket.id);
    if (!ref) return;

    const match = this.matches.get(ref.matchId);
    if (!match) return;

    match.state.players = match.state.players.filter((p) => p.id !== ref.playerId);
    match.sockets.delete(ref.playerId);
    this.socketToPlayer.delete(socket.id);

    const timer = match.disconnectTimers.get(ref.playerId);
    if (timer) {
      clearTimeout(timer);
      match.disconnectTimers.delete(ref.playerId);
    }

    socket.leave(match.state.matchId);

    this.broadcast(match, {
      type: 'match:player_left',
      payload: { playerId: ref.playerId },
    });

    if (match.state.players.length === 0) {
      this.matches.delete(ref.matchId);
    } else {
      this.broadcastState(match);
    }
  }

  private handleGameAction(socket: Socket, payload: { action: string; data?: unknown }) {
    const ref = this.socketToPlayer.get(socket.id);
    if (!ref) {
      this.emitToSocket(socket, {
        type: 'match:action_result',
        payload: { success: false, error: 'No estás en una partida' },
      });
      return;
    }

    const match = this.matches.get(ref.matchId);
    if (!match || match.state.phase !== 'playing') {
      this.emitToSocket(socket, {
        type: 'match:action_result',
        payload: { success: false, error: 'Partida no activa' },
      });
      return;
    }

    // TODO: validar turno, reglas del módulo de juego, aplicar jugada
    // Por ahora solo confirmamos recepción
    this.emitToSocket(socket, {
      type: 'match:action_result',
      payload: { success: true },
    });
    match.state.updatedAt = Date.now();
    this.broadcastState(match);
  }

  /** Reconexión: el cliente debe enviar un token/sesión real en el futuro */
  attemptReconnect(socket: Socket, playerId: string, matchId: string) {
    const match = this.matches.get(matchId);
    if (!match) return false;

    const player = match.state.players.find((p) => p.id === playerId);
    if (!player) return false;

    // Cancelar timer de abandono
    const timer = match.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      match.disconnectTimers.delete(playerId);
    }

    player.status = 'connected';
    player.isBot = false;
    player.botLevel = undefined;

    match.sockets.set(playerId, socket.id);
    this.socketToPlayer.set(socket.id, { matchId, playerId });
    socket.join(matchId);

    this.broadcast(match, {
      type: 'match:player_reconnected',
      payload: { playerId },
    });
    this.broadcastState(match);
    return true;
  }

  private broadcast(match: InternalMatch, event: ServerEvent) {
    this.io.to(match.state.matchId).emit('event', event);
  }

  private broadcastState(match: InternalMatch) {
    this.broadcast(match, {
      type: 'match:state',
      payload: match.state,
    });
  }

  private emitToSocket(socket: Socket, event: ServerEvent) {
    socket.emit('event', event);
  }

  private generateCode(): string {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }
}
