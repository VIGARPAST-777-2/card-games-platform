import { io, Socket } from 'socket.io-client';
import type { ClientAction, ServerEvent } from '@deckora/shared';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(token?: string) {
  const s = getSocket();
  if (token) {
    s.auth = { token };
  }
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function sendAction(action: ClientAction) {
  getSocket().emit('action', action);
}

export function onServerEvent(handler: (event: ServerEvent) => void) {
  const s = getSocket();
  s.on('event', handler);
  return () => {
    s.off('event', handler);
  };
}
