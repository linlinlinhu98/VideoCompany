/**
 * Simple token-bucket rate limiter for Socket.IO connections.
 * Each connection gets a configurable number of messages per time window.
 */

interface RateLimitConfig {
  /** Maximum messages per window */
  maxMessages: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface Bucket {
  tokens: number;
  lastRefill: number;
}

/**
 * Create a per-socket rate limiter.
 */
export function createRateLimiter(config: RateLimitConfig = { maxMessages: 10, windowMs: 10000 }) {
  const buckets = new Map<string, Bucket>();

  return {
    /**
     * Check if a socket can send a message.
     * Returns true if allowed, false if rate limited.
     */
    allow(socketId: string): boolean {
      const now = Date.now();
      let bucket = buckets.get(socketId);

      if (!bucket) {
        bucket = { tokens: config.maxMessages, lastRefill: now };
        buckets.set(socketId, bucket);
      }

      // Refill tokens
      const elapsed = now - bucket.lastRefill;
      const refillRate = config.maxMessages / config.windowMs;
      const refill = Math.floor(elapsed * refillRate);

      if (refill > 0) {
        bucket.tokens = Math.min(config.maxMessages, bucket.tokens + refill);
        bucket.lastRefill = now;
      }

      if (bucket.tokens > 0) {
        bucket.tokens--;
        return true;
      }

      return false;
    },

    /** Clean up bucket when socket disconnects */
    remove(socketId: string): void {
      buckets.delete(socketId);
    },
  };
}
