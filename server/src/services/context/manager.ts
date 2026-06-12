import type { Message } from 'shared';
import { CONTEXT_WINDOW_BUDGET, CONTEXT_WINDOW_STANDARD, CONTEXT_WINDOW_PREMIUM, MAX_FRAMES_IN_CONTEXT } from 'shared';
import type { ModelTier } from 'shared';

/**
 * Context manager that maintains a sliding window of conversation history.
 * Implements cost-saving strategies:
 * - Limits turns per tier
 * - Keeps only N most recent frames
 * - Summarizes old turns (stub — can be extended with LLM summarization)
 */

export function getContextWindowSize(tier: ModelTier): number {
  switch (tier) {
    case 'premium': return CONTEXT_WINDOW_PREMIUM;
    case 'standard': return CONTEXT_WINDOW_STANDARD;
    case 'budget': return CONTEXT_WINDOW_BUDGET;
  }
}

/**
 * Trim conversation history to fit within context window.
 * Keeps the most recent N turns and the most recent M frames.
 */
export function pruneConversation(
  messages: Message[],
  tier: ModelTier,
): Message[] {
  const windowSize = getContextWindowSize(tier);

  // If within window, return as-is
  if (messages.length <= windowSize * 2) {
    return keepRecentFrames(messages);
  }

  // Keep the most recent turns
  const recentMessages = messages.slice(-(windowSize * 2));

  return keepRecentFrames(recentMessages);
}

/**
 * Keep only the most recent frames in the conversation.
 * Older frames are expensive (in tokens) and rarely needed.
 */
function keepRecentFrames(messages: Message[]): Message[] {
  const frameCount = messages.filter((m) => m.frame).length;

  if (frameCount <= MAX_FRAMES_IN_CONTEXT) {
    return messages;
  }

  // Remove frames from older messages, keep text
  let framesSeen = 0;
  const result: Message[] = [];

  // Iterate from oldest to newest
  for (const msg of messages) {
    if (msg.frame) {
      framesSeen++;
      if (framesSeen <= frameCount - MAX_FRAMES_IN_CONTEXT) {
        // Strip frame, keep text
        result.push({ ...msg, frame: undefined });
      } else {
        result.push(msg);
      }
    } else {
      result.push(msg);
    }
  }

  return result;
}

/**
 * Build conversation summary (stub — real implementation would call a cheap LLM).
 */
export function summarizeOldTurns(_messages: Message[]): string {
  // A real implementation would call Haiku to summarize
  // For now, return a simple note
  return '';
}
