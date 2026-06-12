import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { registerHandlers } from './handlers.js';

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server attached to an HTTP server.
 */
export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.CLIENT_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    connectTimeout: 10000,
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Socket connected');

    // Send welcome status
    socket.emit('server:status', {
      sessionId: '',
      status: 'connected' as const,
      message: '已连接到服务器',
    });

    // Register event handlers
    registerHandlers(socket);
  });

  logger.info('Socket.IO server initialized');
  return io;
}

/**
 * Get the Socket.IO server instance (for use in other modules).
 */
export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Graceful shutdown.
 */
export function shutdownIO(): void {
  if (io) {
    io.close();
    io = null;
  }
}
