import { useState, type FormEvent } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useCostStore } from '@/stores/useCostStore';
import { formatCost } from '@/lib/format-cost';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Slide-out settings panel for model selection, budget, and TTS preferences.
 */
export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { modelTier, setModelTier, budgetLimit, setBudgetLimit, ttsRate, setTtsRate, autoSpeak, setAutoSpeak } =
    useSettingsStore();
  const totalCost = useCostStore((s) => s.totalCost);

  const [localBudget, setLocalBudget] = useState(String(budgetLimit));
  const [localTtsRate, setLocalTtsRate] = useState(String(ttsRate));

  const handleSaveBudget = () => {
    const val = parseFloat(localBudget);
    if (!isNaN(val) && val > 0 && val <= 5) {
      setBudgetLimit(val);
      useCostStore.getState().setBudgetLimit(val);
    }
  };

  const handleSaveTtsRate = () => {
    const val = parseFloat(localTtsRate);
    if (!isNaN(val) && val >= 0.5 && val <= 2) {
      setTtsRate(val);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-surface-900 border-l border-white/10 z-50
                      flex flex-col animate-fade-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold">设置</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-800 rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 className="text-surface-200" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Model tier */}
          <section>
            <h3 className="text-xs font-semibold text-surface-200 uppercase tracking-wider mb-3">AI 模型</h3>
            <div className="space-y-2">
              {([
                { value: 'budget', label: '经济', desc: 'GPT-4o Mini · 快速便宜', cost: '~$0.001/次' },
                { value: 'standard', label: '标准', desc: 'GPT-4o · 均衡推荐', cost: '~$0.005/次' },
                { value: 'premium', label: '高级', desc: 'Claude Sonnet · 最强效果', cost: '~$0.01/次' },
              ] as const).map(({ value, label, desc, cost }) => (
                <label
                  key={value}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    modelTier === value
                      ? 'bg-primary-600/10 border border-primary-500/30'
                      : 'bg-surface-800/30 border border-transparent hover:bg-surface-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="modelTier"
                    value={value}
                    checked={modelTier === value}
                    onChange={() => setModelTier(value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-surface-200 mt-0.5">{desc}</div>
                    <div className="text-[10px] text-surface-200/60 mt-0.5 font-mono">{cost}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Budget */}
          <section>
            <h3 className="text-xs font-semibold text-surface-200 uppercase tracking-wider mb-3">预算限制</h3>
            <div className="bg-surface-800/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-200">每会话预算</span>
                <span className="text-xs font-mono text-surface-200">
                  已用 {formatCost(totalCost)} / {formatCost(budgetLimit)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-200">$</span>
                <input
                  type="number"
                  min="0.10"
                  max="5.00"
                  step="0.10"
                  value={localBudget}
                  onChange={(e) => setLocalBudget(e.target.value)}
                  onBlur={handleSaveBudget}
                  className="flex-1 bg-surface-700 border border-white/10 rounded-lg px-3 py-1.5
                             text-sm text-white focus:outline-none focus:border-primary-500/50
                             [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={handleSaveBudget}
                  className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-xs transition-colors"
                >
                  保存
                </button>
              </div>
              <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    totalCost / budgetLimit > 0.95 ? 'bg-red-500' :
                    totalCost / budgetLimit > 0.8 ? 'bg-orange-500' :
                    totalCost / budgetLimit > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, (totalCost / budgetLimit) * 100)}%` }}
                />
              </div>
            </div>
          </section>

          {/* TTS settings */}
          <section>
            <h3 className="text-xs font-semibold text-surface-200 uppercase tracking-wider mb-3">语音设置</h3>
            <div className="bg-surface-800/30 rounded-xl p-3 space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-xs text-surface-200">自动朗读回复</span>
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="rounded"
                />
              </label>
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-200">语速</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={localTtsRate}
                    onChange={(e) => {
                      setLocalTtsRate(e.target.value);
                      handleSaveTtsRate();
                    }}
                    className="w-20"
                  />
                  <span className="text-xs font-mono text-surface-200 w-6">{localTtsRate}x</span>
                </div>
              </div>
            </div>
          </section>

          {/* Session info */}
          <section>
            <h3 className="text-xs font-semibold text-surface-200 uppercase tracking-wider mb-3">当前会话</h3>
            <div className="bg-surface-800/30 rounded-xl p-3 text-xs text-surface-200 space-y-1">
              <p>模型: <span className="text-white">{modelTier}</span></p>
              <p>费用: <span className="text-white font-mono">{formatCost(totalCost)}</span></p>
              <p>预算: <span className="text-white font-mono">{formatCost(budgetLimit)}</span></p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
