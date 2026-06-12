import type { Session, Message, Turn } from 'shared';
import { config } from '../config.js';

/**
 * In-memory session store with TTL-based cleanup.
 * Sessions expire after 30 minutes of inactivity.
 */
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

class SessionStore {
  private sessions = new Map<string, Session>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  /** Create a new session */
  create(sessionId: string): Session {
    const session: Session = {
      id: sessionId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      turns: [],
      messages: [],
      totalCost: 0,
      budgetLimit: config.DEFAULT_BUDGET,
      modelTier: 'budget',
      budgetExceeded: false,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  /** Get a session by ID */
  get(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActiveAt = Date.now();
    }
    return session;
  }

  /** Get or create a session */
  getOrCreate(sessionId: string): Session {
    return this.get(sessionId) || this.create(sessionId);
  }

  /** Update a session */
  update(sessionId: string, updates: Partial<Session>): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    Object.assign(session, updates);
    session.lastActiveAt = Date.now();
    return session;
  }

  /** Add a message to a session */
  addMessage(sessionId: string, message: Message): void {
    const session = this.getOrCreate(sessionId);
    session.messages.push(message);
    session.lastActiveAt = Date.now();
  }

  /** Add a turn to a session */
  addTurn(sessionId: string, turn: Turn): void {
    const session = this.getOrCreate(sessionId);
    session.turns.push(turn);
    session.lastActiveAt = Date.now();
  }

  /** Add cost to a session */
  addCost(sessionId: string, cost: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.totalCost += cost;
    if (session.totalCost >= session.budgetLimit) {
      session.budgetExceeded = true;
    }
    session.lastActiveAt = Date.now();
  }

  /** Delete a session */
  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /** Get count of active sessions */
  get count(): number {
    return this.sessions.size;
  }

  /** Clean up expired sessions */
  private cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastActiveAt > SESSION_TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
  }

  /** Stop the cleanup timer (for graceful shutdown) */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.sessions.clear();
  }
}

export const sessionStore = new SessionStore();
