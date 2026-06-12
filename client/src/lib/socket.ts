import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from 'shared';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

/**
 * Create a Socket.IO client connected to the backend.
 * Uses Vite proxy in dev (no URL needed), direct URL in production.
 */
export function createSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
  });

  return socket;
}

/** Singleton socket instance */
let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socketInstance) {
    socketInstance = createSocket();
  }
  return socketInstance;
}
