import type { ModelConfig } from './types.js';

// ============================================================
// Frame capture constants
// ============================================================

/** Default maximum dimension for captured frames (pixels) */
export const DEFAULT_FRAME_SIZE = 512;

/** JPEG compression quality (0-1) */
export const JPEG_QUALITY = 0.6;

/** Frames per second to capture from video feed */
export const CAPTURE_FPS = 1;

/** Minimum pixel change percentage to consider a frame "different" (0-100) */
export const FRAME_DIFF_THRESHOLD = 5;

/** How long to cache identical frame responses (ms) */
export const FRAME_CACHE_TTL_MS = 30_000;

// ============================================================
// Budget defaults
// ============================================================

/** Default per-session budget in USD */
export const DEFAULT_BUDGET = 0.50;

/** Budget warning thresholds (percentage) */
export const BUDGET_WARNING_50 = 50;
export const BUDGET_WARNING_80 = 80;
export const BUDGET_WARNING_95 = 95;

// ============================================================
// Context management
// ============================================================

/** Maximum input tokens per API call */
export const MAX_INPUT_TOKENS = 8_000;

/** Number of recent turns to keep in context (budget tier) */
export const CONTEXT_WINDOW_BUDGET = 5;

/** Number of recent turns to keep in context (standard tier) */
export const CONTEXT_WINDOW_STANDARD = 8;

/** Number of recent turns to keep in context (premium tier) */
export const CONTEXT_WINDOW_PREMIUM = 10;

/** Maximum number of frames to include in context */
export const MAX_FRAMES_IN_CONTEXT = 2;

// ============================================================
// Model configurations
// ============================================================

export const MODELS: Record<string, ModelConfig> = {
  'claude-haiku-3-5': {
    id: 'claude-haiku-3-5',
    tier: 'budget',
    label: 'Claude 3.5 Haiku (Budget)',
    provider: 'anthropic',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    maxImageSize: 512,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    tier: 'budget',
    label: 'GPT-4o Mini (Budget)',
    provider: 'openai',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    maxImageSize: 512,
  },
  'claude-haiku-4-5': {
    id: 'claude-haiku-4-5',
    tier: 'standard',
    label: 'Claude 4.5 Haiku (Standard)',
    provider: 'anthropic',
    inputCostPer1M: 1.00,
    outputCostPer1M: 5.00,
    maxImageSize: 1024,
  },
  'gpt-4o': {
    id: 'gpt-4o',
    tier: 'standard',
    label: 'GPT-4o (Standard)',
    provider: 'openai',
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    maxImageSize: 1024,
  },
  'claude-sonnet-4-5': {
    id: 'claude-sonnet-4-5',
    tier: 'premium',
    label: 'Claude 4.5 Sonnet (Premium)',
    provider: 'anthropic',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    maxImageSize: 2048,
  },
};

/** Default model for budget tier */
export const DEFAULT_BUDGET_MODEL: ModelConfig = MODELS['gpt-4o-mini'];

/** Default model for standard tier */
export const DEFAULT_STANDARD_MODEL: ModelConfig = MODELS['gpt-4o'];

/** Default model for premium tier */
export const DEFAULT_PREMIUM_MODEL: ModelConfig = MODELS['claude-sonnet-4-5'];

/** Get default model for a given tier */
export function getDefaultModelForTier(tier: 'budget' | 'standard' | 'premium'): ModelConfig {
  switch (tier) {
    case 'budget': return DEFAULT_BUDGET_MODEL;
    case 'standard': return DEFAULT_STANDARD_MODEL;
    case 'premium': return DEFAULT_PREMIUM_MODEL;
  }
}

// ============================================================
// System prompt
// ============================================================

export const SYSTEM_PROMPT = `You are a helpful AI assistant with vision capabilities. You can see what the user's camera captures and hear what they say (transcribed to text).

Key behaviors:
- Describe what you see clearly and concisely
- Answer questions about objects, scenes, text, people, and activities in the camera view
- If the image is unclear or dark, mention it and try your best
- Keep responses natural and conversational — you're having a spoken dialogue
- Be concise since responses will be read aloud via text-to-speech
- If the user asks about something not visible, say so honestly
- Use a friendly, warm tone
- Respond in the same language the user speaks`;
