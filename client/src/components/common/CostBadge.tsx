import { useCostStore, type WarningLevel } from '@/stores/useCostStore';
import { formatCost } from '@/lib/format-cost';

/**
 * Compact cost indicator showing session API cost and budget status.
 * Displayed in the header bar.
 */
export function CostBadge() {
  const totalCost = useCostStore((s) => s.totalCost);
  const budgetLimit = useCostStore((s) => s.budgetLimit);
  const warningLevel = useCostStore((s) => s.warningLevel);
  const lastTurnCost = useCostStore((s) => s.lastTurnCost);

  const colorClasses: Record<WarningLevel, string> = {
    none: 'bg-surface-700/50 text-surface-200',
    low: 'bg-yellow-500/10 text-yellow-300',
    medium: 'bg-orange-500/10 text-orange-300',
    high: 'bg-red-500/10 text-red-300',
    exceeded: 'bg-red-500/20 text-red-400 animate-pulse',
  };

  const colorClass = colorClasses[warningLevel];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono ${colorClass} transition-colors`}
      title={`会话费用: ${formatCost(totalCost)} / ${formatCost(budgetLimit)}${lastTurnCost > 0 ? ` (上次: ${formatCost(lastTurnCost)})` : ''}`}
    >
      <span className="text-[10px] opacity-70">$</span>
      <span>{formatCost(totalCost)}</span>
      {budgetLimit < Infinity && (
        <>
          <span className="opacity-40">/</span>
          <span className="opacity-60">{formatCost(budgetLimit)}</span>
        </>
      )}
    </div>
  );
}
