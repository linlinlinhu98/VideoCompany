import type { Message } from 'shared';

/** Input to the vision API */
export interface VisionRequest {
  /** Conversation history (including current user message) */
  messages: Message[];
  /** Current frame (base64 JPEG data) */
  frameBase64?: string;
  /** Current frame MIME type */
  frameMimeType?: string;
  /** System prompt override */
  systemPrompt?: string;
  /** Model to use */
  modelId: string;
  /** Maximum output tokens */
  maxTokens?: number;
  /** Whether to stream the response */
  stream?: boolean;
}

/** Output from the vision API */
export interface VisionResponse {
  /** Response text */
  text: string;
  /** Input tokens used */
  inputTokens: number;
  /** Output tokens used */
  outputTokens: number;
  /** Whether prompt caching was used */
  cacheHit?: boolean;
  /** Cached input tokens */
  cachedInputTokens?: number;
}

/** Callback for streaming response chunks */
export type StreamCallback = (chunk: string) => void;

/**
 * Abstract interface for vision model clients.
 * Implemented by Claude and OpenAI wrappers.
 */
export interface VisionClient {
  /** Send a request and get a complete response */
  analyze(request: VisionRequest): Promise<VisionResponse>;

  /** Send a request and stream the response */
  analyzeStream(request: VisionRequest, onChunk: StreamCallback): Promise<VisionResponse>;
}
