import { FRAME_CACHE_TTL_MS } from 'shared';

interface CacheEntry {
  response: string;
  timestamp: number;
}

/**
 * Simple in-memory LRU-like cache for frame-based responses.
 *
 * When the same frame (MD5 hash) is sent within TTL,
 * we reuse the previous AI response for the visual part.
 * Still processes text query, but saves vision API tokens.
 */
export class FrameCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  /**
   * Get cached response for a frame hash.
   * Returns null if not cached or expired.
   */
  get(hash: string): string | null {
    const entry = this.cache.get(hash);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > FRAME_CACHE_TTL_MS) {
      this.cache.delete(hash);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(hash);
    this.cache.set(hash, entry);

    return entry.response;
  }

  /**
   * Cache a response for a frame hash.
   */
  set(hash: string, response: string): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(hash, {
      response,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached entries.
   */
  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

export const frameCache = new FrameCache();
