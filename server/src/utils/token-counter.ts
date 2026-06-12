/**
 * Estimate token count for text and images.
 * These are approximations used for cost estimation before API calls.
 */

const CHARS_PER_TOKEN = 3.5; // Rough average for English + Chinese mixed text

/**
 * Estimate token count for a text string.
 */
export function estimateTextTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Estimate token count for a JPEG image of given dimensions.
 *
 * Based on empirical data:
 * - 512x512 JPEG: ~250-400 tokens (GPT-4o) / ~400-600 (Claude)
 * - GPT-4o uses tile-based approach: ~85 base + 170 per 512x512 tile
 * - Claude uses pixels-based: ~1.33 tokens per 1000 pixels
 *
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param provider - 'openai' or 'anthropic'
 */
export function estimateImageTokens(
  width: number,
  height: number,
  provider: 'openai' | 'anthropic' = 'openai',
): number {
  if (provider === 'openai') {
    // GPT-4o: 85 base tokens + tiles
    const tilesWide = Math.ceil(width / 512);
    const tilesHigh = Math.ceil(height / 512);
    const numTiles = tilesWide * tilesHigh;
    return 85 + numTiles * 170;
  }

  // Claude: ~1.33 tokens per 1K pixels
  const pixels = width * height;
  return Math.ceil((pixels / 1000) * 1.33);
}

/**
 * Estimate total input tokens for a message with optional frame.
 */
export function estimateTotalInputTokens(
  text: string,
  frame?: { width: number; height: number; provider?: 'openai' | 'anthropic' },
): number {
  let tokens = estimateTextTokens(text);

  if (frame) {
    tokens += estimateImageTokens(frame.width, frame.height, frame.provider || 'openai');
  }

  // Add overhead for system prompt and conversation structure
  tokens += 500;

  return tokens;
}
