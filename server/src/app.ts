import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { healthRoutes } from './routes/health.js';
import { sessionRoutes } from './routes/session.js';
import { initSocketIO } from './ws/index.js';

const app = Fastify({
  logger: false,
  disableRequestLogging: true,
});

// Register CORS
await app.register(cors, {
  origin: config.CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
});

// Register routes
await app.register(healthRoutes, { prefix: '/api' });
await app.register(sessionRoutes, { prefix: '/api' });

// Initialize Socket.IO on the underlying HTTP server
const io = initSocketIO(app.server);

// Graceful shutdown
const shutdownSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
for (const signal of shutdownSignals) {
  process.on(signal, async () => {
    logger.info({ signal }, 'Shutting down...');
    await app.close();
    process.exit(0);
  });
}

export { app as fastify, io };
