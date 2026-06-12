import { fastify } from './app.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
    logger.info({ port: config.PORT }, `Server listening on port ${config.PORT}`);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

main();
