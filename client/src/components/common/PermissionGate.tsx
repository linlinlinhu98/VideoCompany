import { useState, type ReactNode } from 'react';

interface PermissionGateProps {
  children: ReactNode;
  onGranted: () => void;
}

/**
 * Initial permission screen shown before camera/mic access is granted.
 * Displays instructions and a start button.
 * Browser will show its own permission prompt when getUserMedia is called.
 */
export function PermissionGate({ children, onGranted }: PermissionGateProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      await onGranted();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start media devices';
      setError(message);
      setIsRequesting(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      {/* Logo / Icon */}
      <div className="w-20 h-20 rounded-2xl bg-primary-500/15 flex items-center justify-center mb-6
                      ring-1 ring-primary-500/20">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             className="text-primary-400" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z"/>
          <path d="M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"/>
          <circle cx="12" cy="12" r="1.5"/>
          <path d="M6 22h12"/>
        </svg>
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-2">AI 视觉对话助手</h1>
      <p className="text-surface-200 max-w-sm mb-8 leading-relaxed">
        让 AI 看到你眼前的画面，听到你说的话。
        <br />
        需要访问摄像头和麦克风权限。
      </p>

      {/* Feature preview */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-md">
        {[
          { icon: '👁️', label: '视觉理解' },
          { icon: '🎤', label: '语音输入' },
          { icon: '🔊', label: '语音回复' },
        ].map(({ icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-800/50">
            <span className="text-2xl">{icon}</span>
            <span className="text-xs text-surface-200">{label}</span>
          </div>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 max-w-sm">
          <p className="text-sm text-red-400">{error}</p>
          <p className="text-xs text-surface-200 mt-1">
            请检查浏览器权限设置，确保摄像头和麦克风未被阻止。
          </p>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={isRequesting}
        className="px-8 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50
                   rounded-xl font-medium text-lg transition-all
                   focus:outline-none focus:ring-2 focus:ring-primary-500/50
                   active:scale-95 shadow-lg shadow-primary-600/25"
      >
        {isRequesting ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            正在请求权限...
          </span>
        ) : (
          '开始对话'
        )}
      </button>

      <p className="text-xs text-surface-200 mt-4">
        支持 Chrome、Edge、Safari 等现代浏览器
      </p>
    </div>
  );
}
