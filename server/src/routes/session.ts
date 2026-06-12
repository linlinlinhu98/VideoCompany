import type { FastifyPluginAsync } from 'fastify';
import { v4 as uuid } from 'uuid';
import { config } from '../config.js';
import type { Session, SessionInfo } from 'shared';

/** Simple in-memory session store (replaced by ws/session-store.ts later) */
const sessions = new Map<string, Session>();

export const sessionRoutes: FastifyPluginAsync = async (app) => {
  app.post('/sessions', async (_req, reply) => {
    const session: Session = {
      id: uuid(),
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      turns: [],
      messages: [],
      totalCost: 0,
      budgetLimit: config.DEFAULT_BUDGET,
      modelTier: 'budget',
      budgetExceeded: false,
    };

    sessions.set(session.id, session);

    const info: SessionInfo = {
      sessionId: session.id,
      totalCost: session.totalCost,
      budgetLimit: session.budgetLimit,
      turnCount: session.turns.length,
      budgetExceeded: session.budgetExceeded,
      costPercent: 0,
    };

    reply.status(201).send(info);
  });

  // Make session store accessible to other modules
  app.decorate('sessions', sessions);
};

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    sessions: Map<string, Session>;
  }
}
