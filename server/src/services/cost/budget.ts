import { BUDGET_WARNING_50, BUDGET_WARNING_80, BUDGET_WARNING_95 } from 'shared';

export type BudgetWarningLevel = 'none' | 'low' | 'medium' | 'high' | 'exceeded';

interface BudgetCheck {
  allowed: boolean;
  warningLevel: BudgetWarningLevel;
  percentUsed: number;
  remainingBudget: number;
}

/**
 * Check if a request fits within the session budget.
 */
export function checkBudget(
  totalCost: number,
  budgetLimit: number,
  estimatedRequestCost: number = 0,
): BudgetCheck {
  const newTotal = totalCost + estimatedRequestCost;
  const percentUsed = Math.round((newTotal / budgetLimit) * 100);

  let warningLevel: BudgetWarningLevel = 'none';
  let allowed = true;

  if (totalCost >= budgetLimit) {
    warningLevel = 'exceeded';
    allowed = false;
  } else if (newTotal >= budgetLimit) {
    warningLevel = 'exceeded';
    allowed = false;
  } else if (percentUsed >= BUDGET_WARNING_95) {
    warningLevel = 'high';
  } else if (percentUsed >= BUDGET_WARNING_80) {
    warningLevel = 'medium';
  } else if (percentUsed >= BUDGET_WARNING_50) {
    warningLevel = 'low';
  }

  return {
    allowed,
    warningLevel,
    percentUsed,
    remainingBudget: Math.max(0, budgetLimit - newTotal),
  };
}
