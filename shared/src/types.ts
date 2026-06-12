// ============================================================
// Core domain types shared between client and server
// ============================================================

/** Model tier for vision API routing */
export type ModelTier = 'budget' | 'standard' | 'premium';

/** Specific model identifiers */
export type ModelId =
  | 'claude-haiku-3-5'
  | 'claude-haiku-4-5'
  | 'claude-sonnet-4-5'
  | 'gpt-4o-mini'
  | 'gpt-4o';

/** Model configuration */
export interface ModelConfig {
  id: ModelId;
  tier: ModelTier;
  label: string;
  provider: 'anthropic' | 'openai';
  inputCostPer1M: number;   // USD per 1M input tokens
  outputCostPer1M: number;  // USD per 1M output tokens
  maxImageSize: number;     // max image dimension in pixels
}

/** A single frame of video captured at a point in time */
export interface CapturedFrame {
  /** Base64-encoded JPEG data (without data URI prefix) */
  data: string;
  /** MIME type */
  mimeType: 'image/jpeg';
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Timestamp when captured (ms since epoch) */
  timestamp: number;
  /** MD5 hash for deduplication */
  hash: string;
}

/** A single message in the conversation */
export interface Message {
  id: string;
  /** Who sent it */
  role: 'user' | 'assistant' | 'system';
  /** Text content */
  text: string;
  /** Optional frame that was sent with this message (user messages only) */
  frame?: CapturedFrame;
  /** Cost incurred for generating this response (assistant messages only) */
  cost?: number;
  /** Timestamp (ms since epoch) */
  timestamp: number;
  /** Which model generated this response */
  modelId?: ModelId;
  /** If this was an error response */
  isError?: boolean;
}

/** A complete conversation turn (user query + assistant response) */
export interface Turn {
  id: string;
  userMessage: Message;
  assistantMessage?: Message;
  /** Total cost for this turn */
  cost: number;
}

/** Session data tracked on the server */
export interface Session {
  id: string;
  createdAt: number;
  lastActiveAt: number;
  turns: Turn[];
  messages: Message[];
  totalCost: number;
  budgetLimit: number;
  modelTier: ModelTier;
  /** Whether the budget has been exceeded */
  budgetExceeded: boolean;
}

/** Cost breakdown for a single API call */
export interface CostData {
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  modelId: ModelId;
  cachedInputTokens?: number;
  cachedInputCost?: number;
}

/** Session summary returned to client */
export interface SessionInfo {
  sessionId: string;
  totalCost: number;
  budgetLimit: number;
  turnCount: number;
  budgetExceeded: boolean;
  costPercent: number;
}

// ============================================================
// WebSocket event types
// ============================================================

/** Events the client sends to the server */
export interface ClientToServerEvents {
  'client:message': (payload: ClientMessagePayload) => void;
  'client:update-settings': (payload: UpdateSettingsPayload) => void;
  'client:typing': (payload: { isTyping: boolean }) => void;
}

/** Events the server sends to the client */
export interface ServerToClientEvents {
  'server:response': (payload: ServerResponsePayload) => void;
  'server:response-chunk': (payload: ResponseChunkPayload) => void;
  'server:error': (payload: ErrorPayload) => void;
  'server:cost-update': (payload: CostUpdatePayload) => void;
  'server:session-info': (payload: SessionInfo) => void;
  'server:status': (payload: StatusPayload) => void;
}

export interface ClientMessagePayload {
  sessionId: string;
  text: string;
  frame?: {
    data: string;
    mimeType: 'image/jpeg';
    width: number;
    height: number;
    hash: string;
  };
  /** Override the session's default model tier */
  modelTier?: ModelTier;
}

export interface UpdateSettingsPayload {
  sessionId: string;
  modelTier?: ModelTier;
  budgetLimit?: number;
}

export interface ServerResponsePayload {
  messageId: string;
  turnId: string;
  text: string;
  cost: number;
  modelId: ModelId;
  inputTokens: number;
  outputTokens: number;
}

export interface ResponseChunkPayload {
  messageId: string;
  textDelta: string;
  /** true when streaming is complete */
  done: boolean;
}

export interface ErrorPayload {
  code: string;
  message: string;
  /** If the budget was exceeded */
  budgetExceeded?: boolean;
}

export interface CostUpdatePayload {
  sessionId: string;
  totalCost: number;
  budgetLimit: number;
  costPercent: number;
  budgetExceeded: boolean;
  lastTurnCost?: number;
}

export interface StatusPayload {
  sessionId: string;
  status: 'connected' | 'processing' | 'budget-exceeded' | 'error';
  message?: string;
}
