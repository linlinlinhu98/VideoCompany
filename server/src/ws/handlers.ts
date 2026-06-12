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
import { routeModel } from '../services/vision/router.js';
import { OpenAIVisionClient } from '../services/vision/openai.js';
import { ClaudeVisionClient } from '../services/vision/claude.js';
import { calculateCost } from '../services/cost/tracker.js';
import { checkBudget } from '../services/cost/budget.js';
import { pruneConversation } from '../services/context/manager.js';
import { frameCache } from '../services/cache/frame-cache.js';
import { estimateTotalInputTokens } from '../utils/token-counter.js';

// Lazy-initialized vision clients
let openaiClient: OpenAIVisionClient | null = null;
let claudeClient: ClaudeVisionClient | null = null;

function getOpenAI(): OpenAIVisionClient {
  if (!openaiClient) openaiClient = new OpenAIVisionClient();
  return openaiClient;
}

function getClaude(): ClaudeVisionClient {
  if (!claudeClient) claudeClient = new ClaudeVisionClient();
  return claudeClient;
}

/**
 * Register all event handlers for a connected socket.
 */
export function registerHandlers(socket: Socket): void {
  let sessionId: string | null = null;

  /**
   * Handle incoming message from client.
   *
   * Pipeline:
   * 1. Validate session + check budget
   * 2. Check frame cache for duplicate frames
   * 3. Route to appropriate model based on complexity + budget
   * 4. Prune conversation context
   * 5. Call vision API
   * 6. Track cost + update session
   * 7. Send response + cost update to client
   */
  socket.on('client:message', async (payload: ClientMessagePayload, ack) => {
    try {
      sessionId = payload.sessionId;
      const session = sessionStore.getOrCreate(sessionId);

      // ---- Budget check ----
      const budgetCheck = checkBudget(session.totalCost, session.budgetLimit, 0.01);
      if (!budgetCheck.allowed) {
        socket.emit('server:error', {
          code: 'BUDGET_EXCEEDED',
          message: `本会话预算已用完 (${session.budgetLimit.toFixed(2)})。请调整预算或开始新会话。`,
          budgetExceeded: true,
        });
        return;
      }

      // ---- Create user message ----
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
      const updatedSession = sessionStore.get(sessionId)!;

      // ---- Check frame cache ----
      let cachedResponse: string | null = null;
      if (userMsg.frame) {
        cachedResponse = frameCache.get(userMsg.frame.hash);
        if (cachedResponse) {
          logger.info({ sessionId, hash: userMsg.frame.hash }, 'Frame cache hit');
        }
      }

      // ---- Route model ----
      const routing = routeModel(
        payload.text,
        payload.modelTier || updatedSession.modelTier,
        updatedSession.turns.length,
        budgetCheck.remainingBudget,
      );

      logger.info({ sessionId, modelId: routing.model.id, reason: routing.reason }, 'Model routed');

      // ---- Prune context ----
      const prunedMessages = pruneConversation(
        [...updatedSession.messages],
        routing.tier,
      );

      // ---- Call vision API ----
      let aiText: string;
      let inputTokens: number;
      let outputTokens: number;
      let cachedInputTokens: number | undefined;

      if (cachedResponse) {
        aiText = `${cachedResponse}\n\n（基于缓存的画面。你的新问题是："${payload.text}"）`;
        inputTokens = estimateTotalInputTokens(payload.text);
        outputTokens = Math.ceil(aiText.length / 3.5);
      } else {
        try {
          if (routing.model.provider === 'openai') {
            const result = await getOpenAI().analyze({
              messages: prunedMessages,
              frameBase64: userMsg.frame?.data,
              frameMimeType: userMsg.frame?.mimeType,
              modelId: routing.model.id,
              maxTokens: 512,
            });
            aiText = result.text;
            inputTokens = result.inputTokens;
            outputTokens = result.outputTokens;
          } else {
            const result = await getClaude().analyze({
              messages: prunedMessages,
              frameBase64: userMsg.frame?.data,
              frameMimeType: userMsg.frame?.mimeType,
              modelId: routing.model.id,
              maxTokens: 512,
            });
            aiText = result.text;
            inputTokens = result.inputTokens;
            outputTokens = result.outputTokens;
            cachedInputTokens = result.cachedInputTokens;
          }
        } catch (apiErr) {
          logger.error({ err: apiErr, modelId: routing.model.id }, 'Vision API error');
          aiText = `抱歉，AI 服务暂时不可用：${apiErr instanceof Error ? apiErr.message : '未知错误'}\n\n请检查 API 密钥配置或稍后重试。`;

          // Estimate tokens for error response
          inputTokens = estimateTotalInputTokens(payload.text);
          outputTokens = Math.ceil(aiText.length / 3.5);
        }

        // Cache response for identical frames
        if (userMsg.frame) {
          frameCache.set(userMsg.frame.hash, aiText);
        }
      }

      // ---- Track cost ----
      const costData = calculateCost(
        routing.model.id,
        inputTokens,
        outputTokens,
        cachedInputTokens || 0,
      );

      // ---- Create AI message ----
      const aiMsg: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: 'assistant',
        text: aiText,
        timestamp: Date.now(),
        modelId: routing.model.id,
        cost: costData.totalCost,
      };

      // ---- Update session ----
      const turn: Turn = {
        id: `turn_${Date.now()}`,
        userMessage: userMsg,
        assistantMessage: aiMsg,
        cost: costData.totalCost,
      };

      sessionStore.addMessage(sessionId, aiMsg);
      sessionStore.addTurn(sessionId, turn);
      sessionStore.addCost(sessionId, costData.totalCost);

      const finalSession = sessionStore.get(sessionId)!;

      // ---- Send response ----
      socket.emit('server:response', {
        messageId: aiMsg.id,
        turnId: turn.id,
        text: aiText,
        cost: costData.totalCost,
        modelId: routing.model.id,
        inputTokens,
        outputTokens,
      });

      // ---- Send cost update ----
      const costUpdate: CostUpdatePayload = {
        sessionId,
        totalCost: finalSession.totalCost,
        budgetLimit: finalSession.budgetLimit,
        costPercent: Math.round((finalSession.totalCost / finalSession.budgetLimit) * 100),
        budgetExceeded: finalSession.budgetExceeded,
        lastTurnCost: costData.totalCost,
      };
      socket.emit('server:cost-update', costUpdate);

      // ---- Send session info ----
      const info: SessionInfo = {
        sessionId: finalSession.id,
        totalCost: finalSession.totalCost,
        budgetLimit: finalSession.budgetLimit,
        turnCount: finalSession.turns.length,
        budgetExceeded: finalSession.budgetExceeded,
        costPercent: Math.round((finalSession.totalCost / finalSession.budgetLimit) * 100),
      };
      socket.emit('server:session-info', info);

      // Ack
      if (typeof ack === 'function') ack({ success: true });

    } catch (err) {
      logger.error({ err, sessionId }, 'Error handling client message');
      socket.emit('server:error', {
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : '内部服务器错误',
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

    logger.info({ sessionId: payload.sessionId, settings: payload }, 'Settings updated');
  });

  /**
   * Handle client disconnect.
   */
  socket.on('disconnect', (reason) => {
    logger.info({ sessionId, reason }, 'Client disconnected');
  });
}
