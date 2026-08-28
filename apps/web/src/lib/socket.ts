import { io, Socket } from 'socket.io-client';
import type { ClientAction, ServerEvent } from '@deckora/shared';

let socket: Socket | null = null;

/**
 * En desarrollo apunta a localhost:3001.
 * En producción (mismo servicio Render) usa el mismo origen.
 */
function getServerUrl(): string {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  // Producción: mismo host
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  return 'http://localhost:3001';
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getServerUrl(), {
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
