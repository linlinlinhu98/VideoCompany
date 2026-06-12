import { useMediaStore } from '@/stores/useMediaStore';

/**
 * Status bar showing current VAD/processing state.
 * Different visual indicators for each state.
 */
export function StatusBar() {
  const vadState = useMediaStore((s) => s.vadState);
  const micState = useMediaStore((s) => s.micState);

  const stateConfig: Record<string, { label: string; color: string; dot: string }> = {
    idle: { label: '等待语音输入', color: 'text-surface-200', dot: 'bg-surface-200' },
    listening: { label: '正在监听...', color: 'text-primary-300', dot: 'bg-primary-400 animate-pulse' },
    speaking: { label: '正在识别语音...', color: 'text-green-300', dot: 'bg-green-400 animate-pulse' },
    processing: { label: '正在处理...', color: 'text-yellow-300', dot: 'bg-yellow-400 animate-pulse' },
    error: { label: '识别错误', color: 'text-red-300', dot: 'bg-red-400' },
  };

  if (micState === 'muted') {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5">
        <div className="w-2 h-2 rounded-full bg-yellow-400" />
        <span className="text-xs text-yellow-300">麦克风已静音</span>
      </div>
    );
  }

  const config = stateConfig[vadState] || stateConfig.idle;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5">
      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className={`text-xs ${config.color}`}>{config.label}</span>
    </div>
  );
}
