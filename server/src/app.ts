import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { healthRoutes } from './routes/health.js';
import { sessionRoutes } from './routes/session.js';

const app = Fastify({
  logger: false, // We use pino directly
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

export { app as fastify };
