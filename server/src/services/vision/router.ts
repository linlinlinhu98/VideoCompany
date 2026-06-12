import type { ModelTier } from 'shared';
import { MODELS, getDefaultModelForTier } from 'shared';
import type { ModelConfig } from 'shared';

/**
 * Model router that selects the best model based on:
 * 1. User's explicit tier preference
 * 2. Query complexity estimation
 * 3. Budget constraints
 *
 * Cost optimization: routes simple queries to cheap models,
 * complex queries to capable models.
 */

export interface RoutingDecision {
  model: ModelConfig;
  tier: ModelTier;
  reason: string;
}

/**
 * Simple heuristic complexity classifier.
 *
 * Simple queries: short text, no question/comparison words
 * Moderate queries: medium length, has question words
 * Complex queries: long text, comparison/analysis words, long history
 */
export function estimateComplexity(
  text: string,
  historyLength: number,
): 'simple' | 'moderate' | 'complex' {
  const wordCount = text.length;

  // Complex indicators
  const complexWords = [
    'compare', 'analyze', 'explain', 'describe', 'detail',
    '比较', '分析', '解释', '描述', '详细', '区别', '区别',
    'difference', 'between', 'summary', 'review',
  ];

  // Question indicators
  const questionWords = [
    'what', 'why', 'how', 'when', 'where', 'who',
    '什么', '为什么', '怎么', '如何', '哪里', '谁', '哪个',
  ];

  const hasComplexWord = complexWords.some((w) => text.toLowerCase().includes(w));
  const hasQuestionWord = questionWords.some((w) => text.toLowerCase().includes(w));

  // Classification logic
  if (wordCount > 200 || hasComplexWord || historyLength > 8) {
    return 'complex';
  }
  if (wordCount > 50 || hasQuestionWord || historyLength > 3) {
    return 'moderate';
  }
  return 'simple';
}

/**
 * Route a query to the appropriate model.
 */
export function routeModel(
  text: string,
  preferredTier: ModelTier | undefined,
  historyLength: number,
  budgetRemaining: number,
): RoutingDecision {
  const complexity = estimateComplexity(text, historyLength);

  // If user has an explicit preference, respect it
  if (preferredTier) {
    const model = getDefaultModelForTier(preferredTier);
    return {
      model,
      tier: preferredTier,
      reason: `用户选择 ${preferredTier} 等级`,
    };
  }

  // Auto-routing based on complexity and budget
  if (complexity === 'simple' || budgetRemaining < 0.10) {
    const model = MODELS['gpt-4o-mini'];
    return {
      model,
      tier: 'budget',
      reason: budgetRemaining < 0.10
        ? '预算不足，使用经济模型'
        : `简单查询 → ${model.label}`,
    };
  }

  if (complexity === 'moderate' || budgetRemaining < 0.50) {
    // Try GPT-4o first for moderate, fallback to mini if budget tight
    const model = budgetRemaining < 0.20 ? MODELS['gpt-4o-mini'] : MODELS['gpt-4o'];
    return {
      model,
      tier: budgetRemaining < 0.20 ? 'budget' : 'standard',
      reason: `适度查询 → ${model.label}`,
    };
  }

  // Complex: use best available model
  const model = MODELS['gpt-4o'];
  return {
    model,
    tier: 'standard',
    reason: `复杂查询 → ${model.label}`,
  };
}
