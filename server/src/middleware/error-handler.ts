import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../utils/logger.js';

/**
 * Global Fastify error handler.
 * Formats errors consistently and logs them.
 */
export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  logger.error(
    {
      err: error,
      statusCode: error.statusCode,
      validation: error.validation,
    },
    'Request error',
  );

  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation,
    });
    return;
  }

  const statusCode = error.statusCode || 500;

  reply.status(statusCode).send({
    error: error.name || 'Internal Server Error',
    message: statusCode === 500 ? '内部服务器错误' : error.message,
  });
}
