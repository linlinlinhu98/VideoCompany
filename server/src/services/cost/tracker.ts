import type { CostData } from 'shared';
import { MODELS } from 'shared';

/**
 * Calculate cost from token usage for a specific model.
 */
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  cachedInputTokens: number = 0,
): CostData {
  const model = MODELS[modelId];
  if (!model) {
    // Unknown model — use conservative estimate
    return {
      inputTokens,
      outputTokens,
      inputCost: (inputTokens / 1_000_000) * 5,
      outputCost: (outputTokens / 1_000_000) * 15,
      totalCost: (inputTokens / 1_000_000) * 5 + (outputTokens / 1_000_000) * 15,
      modelId: modelId as any,
    };
  }

  const inputCost = ((inputTokens - cachedInputTokens) / 1_000_000) * model.inputCostPer1M;
  const cachedInputCost = (cachedInputTokens / 1_000_000) * (model.inputCostPer1M * 0.1); // 90% savings
  const outputCost = (outputTokens / 1_000_000) * model.outputCostPer1M;

  return {
    inputTokens,
    outputTokens,
    inputCost: inputCost + cachedInputCost,
    outputCost,
    totalCost: inputCost + cachedInputCost + outputCost,
    modelId: model.id,
    cachedInputTokens: cachedInputTokens > 0 ? cachedInputTokens : undefined,
    cachedInputCost: cachedInputTokens > 0 ? cachedInputCost : undefined,
  };
}
