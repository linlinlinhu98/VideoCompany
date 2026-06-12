import type { Socket } from 'socket.io';
import type {
  ClientMessagePayload,
  UpdateSettingsPayload,
  Message,
  Turn,
  SessionInfo,
  CostUpdatePayload,
  StatusPayload,
} from 'shared';
import { sessionStore } from './session-store.js';
import { logger } from '../utils/logger.js';

/**
 * Register all event handlers for a connected socket.
 */
export function registerHandlers(socket: Socket): void {
  let sessionId: string | null = null;

  /**
   * Handle incoming message from client.
   * Core pipeline: validate → store user message → call vision API → stream response.
   */
  socket.on('client:message', async (payload: ClientMessagePayload, ack) => {
    try {
      sessionId = payload.sessionId;
      const session = sessionStore.getOrCreate(sessionId);

      // Check budget
      if (session.budgetExceeded) {
        socket.emit('server:error', {
          code: 'BUDGET_EXCEEDED',
          message: '本会话预算已用完。请调整预算限制或开始新会话。',
          budgetExceeded: true,
        });
        return;
      }

      // Create user message
      const userMsg: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: 'user',
        text: payload.text,
        frame: payload.frame
          ? {
              data: payload.frame.data,
              mimeType: payload.frame.mimeType,
              width: payload.frame.width,
              height: payload.frame.height,
              hash: payload.frame.hash,
              timestamp: Date.now(),
            }
          : undefined,
        timestamp: Date.now(),
      };

      sessionStore.addMessage(sessionId, userMsg);
      logger.info({ sessionId, textLen: payload.text.length, hasFrame: !!payload.frame }, 'Received user message');

      // For now, return a placeholder response (Phase 4 will add real AI)
      const turn: Turn = {
        id: `turn_${Date.now()}`,
        userMessage: userMsg,
        cost: 0,
      };

      const aiText = `[占位回复] 收到你的消息："${payload.text.substring(0, 100)}"。\n\n真实 AI 视觉回复将在 Phase 4 接入。`;

      const aiMsg: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: 'assistant',
        text: aiText,
        timestamp: Date.now(),
        modelId: 'gpt-4o-mini',
        cost: 0.001,
      };

      sessionStore.addMessage(sessionId, aiMsg);
      turn.assistantMessage = aiMsg;
      turn.cost = 0.001;
      sessionStore.addTurn(sessionId, turn);
      sessionStore.addCost(sessionId, 0.001);

      // Send response
      socket.emit('server:response', {
        messageId: aiMsg.id,
        turnId: turn.id,
        text: aiText,
        cost: 0.001,
        modelId: 'gpt-4o-mini',
        inputTokens: 100,
        outputTokens: 50,
      });

      // Send cost update
      const costData: CostUpdatePayload = {
        sessionId,
        totalCost: session.totalCost,
        budgetLimit: session.budgetLimit,
        costPercent: Math.round((session.totalCost / session.budgetLimit) * 100),
        budgetExceeded: session.budgetExceeded,
        lastTurnCost: 0.001,
      };
      socket.emit('server:cost-update', costData);

      // Send session info
      const info: SessionInfo = {
        sessionId: session.id,
        totalCost: session.totalCost,
        budgetLimit: session.budgetLimit,
        turnCount: session.turns.length,
        budgetExceeded: session.budgetExceeded,
        costPercent: Math.round((session.totalCost / session.budgetLimit) * 100),
      };
      socket.emit('server:session-info', info);

      // Ack
      if (typeof ack === 'function') ack({ success: true });

    } catch (err) {
      logger.error({ err, sessionId }, 'Error handling client message');
      socket.emit('server:error', {
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : '内部错误',
      });
      if (typeof ack === 'function') ack({ success: false, error: String(err) });
    }
  });

  /**
   * Handle settings update from client.
   */
  socket.on('client:update-settings', (payload: UpdateSettingsPayload) => {
    if (!payload.sessionId) return;
    const session = sessionStore.get(payload.sessionId);
    if (!session) return;

    if (payload.modelTier) {
      session.modelTier = payload.modelTier;
    }
    if (payload.budgetLimit !== undefined) {
      session.budgetLimit = payload.budgetLimit;
      session.budgetExceeded = session.totalCost >= payload.budgetLimit;
    }

    const info: SessionInfo = {
      sessionId: session.id,
      totalCost: session.totalCost,
      budgetLimit: session.budgetLimit,
      turnCount: session.turns.length,
      budgetExceeded: session.budgetExceeded,
      costPercent: Math.round((session.totalCost / session.budgetLimit) * 100),
    };
    socket.emit('server:session-info', info);
  });

  /**
   * Handle client disconnect.
   */
  socket.on('disconnect', (reason) => {
    logger.info({ sessionId, reason }, 'Client disconnected');
  });
}
