/**
 * Format a USD cost value for display.
 * - < $0.01: show in micro-dollars with 4 decimal places
 * - < $1.00: show cents with 3 decimal places
 * - >= $1.00: show dollars with 2 decimal places
 */
export function formatCost(usd: number): string {
  if (usd < 0.0001) return '$0.0000';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

/**
 * Format cost as a compact label with unit suffix.
 * e.g., 0.003 → "$3.0m" (3 millidollars)
 */
export function formatCostCompact(usd: number): string {
  if (usd < 0.001) return `${(usd * 1_000_000).toFixed(1)}µ`;
  if (usd < 1) return `${(usd * 1000).toFixed(1)}m`;
  return `$${usd.toFixed(2)}`;
}

/**
 * Format token count for display.
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1_000_000).toFixed(1)}M`;
}
