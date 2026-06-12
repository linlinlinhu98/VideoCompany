import { create } from 'zustand';
import type { ModelTier } from 'shared';
import { DEFAULT_BUDGET, BUDGET_WARNING_50, BUDGET_WARNING_80, BUDGET_WARNING_95 } from 'shared';

export type WarningLevel = 'none' | 'low' | 'medium' | 'high' | 'exceeded';

interface CostStore {
  /** Total USD cost incurred this session */
  totalCost: number;
  /** Budget limit in USD */
  budgetLimit: number;
  /** Budget exceeded flag */
  budgetExceeded: boolean;
  /** Current warning level */
  warningLevel: WarningLevel;
  /** Cost of the last turn */
  lastTurnCost: number;

  // Actions
  setTotalCost: (cost: number) => void;
  addCost: (cost: number) => void;
  setBudgetLimit: (limit: number) => void;
  setLastTurnCost: (cost: number) => void;
  resetCost: () => void;

  // Computed
  costPercent: () => number;
  remainingBudget: () => number;
}

function computeWarningLevel(percent: number, exceeded: boolean): WarningLevel {
  if (exceeded || percent >= 100) return 'exceeded';
  if (percent >= BUDGET_WARNING_95) return 'high';
  if (percent >= BUDGET_WARNING_80) return 'medium';
  if (percent >= BUDGET_WARNING_50) return 'low';
  return 'none';
}

export const useCostStore = create<CostStore>((set, get) => ({
  totalCost: 0,
  budgetLimit: DEFAULT_BUDGET,
  budgetExceeded: false,
  warningLevel: 'none',
  lastTurnCost: 0,

  setTotalCost: (totalCost) => {
    const { budgetLimit } = get();
    const percent = (totalCost / budgetLimit) * 100;
    const budgetExceeded = totalCost >= budgetLimit;
    set({
      totalCost,
      budgetExceeded,
      warningLevel: computeWarningLevel(percent, budgetExceeded),
    });
  },

  addCost: (cost) => {
    const { totalCost, budgetLimit } = get();
    const newTotal = totalCost + cost;
    const percent = (newTotal / budgetLimit) * 100;
    const budgetExceeded = newTotal >= budgetLimit;
    set({
      totalCost: newTotal,
      budgetExceeded,
      warningLevel: computeWarningLevel(percent, budgetExceeded),
    });
  },

  setBudgetLimit: (budgetLimit) => {
    const { totalCost } = get();
    const percent = (totalCost / budgetLimit) * 100;
    const budgetExceeded = totalCost >= budgetLimit;
    set({
      budgetLimit,
      budgetExceeded,
      warningLevel: computeWarningLevel(percent, budgetExceeded),
    });
  },

  setLastTurnCost: (lastTurnCost) => set({ lastTurnCost }),

  resetCost: () =>
    set({
      totalCost: 0,
      budgetExceeded: false,
      warningLevel: 'none',
      lastTurnCost: 0,
    }),

  costPercent: () => {
    const { totalCost, budgetLimit } = get();
    return Math.round((totalCost / budgetLimit) * 100);
  },

  remainingBudget: () => {
    const { totalCost, budgetLimit } = get();
    return Math.max(0, budgetLimit - totalCost);
  },
}));
