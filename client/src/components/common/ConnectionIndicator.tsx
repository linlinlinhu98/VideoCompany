type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

interface ConnectionIndicatorProps {
  state: ConnectionState;
  onReconnect?: () => void;
}

/**
 * Small connection status indicator dot + optional label.
 */
export function ConnectionIndicator({ state, onReconnect }: ConnectionIndicatorProps) {
  const config: Record<ConnectionState, { color: string; label: string; pulse: boolean }> = {
    connected: { color: 'bg-green-400', label: '已连接', pulse: false },
    connecting: { color: 'bg-yellow-400', label: '连接中...', pulse: true },
    disconnected: { color: 'bg-red-400', label: '未连接', pulse: false },
    reconnecting: { color: 'bg-yellow-400', label: '重连中...', pulse: true },
  };

  const { color, label, pulse } = config[state];

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`} />
      <span className="text-[10px] text-surface-200 hidden sm:inline">{label}</span>
      {state === 'disconnected' && onReconnect && (
        <button
          onClick={onReconnect}
          className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors"
        >
          重连
        </button>
      )}
    </div>
  );
}
