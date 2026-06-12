import { useMediaStore, type VadState } from '@/stores/useMediaStore';

interface MicButtonProps {
  /** Called when user clicks the mic to start/stop */
  onToggle: () => void;
  /** Whether mic is actively listening */
  isActive: boolean;
  /** Whether speech recognition is supported */
  isSupported: boolean;
}

/**
 * Animated microphone button with VAD state indication.
 *
 * Visual states:
 * - idle: gray mic icon
 * - listening: blue ring, static mic
 * - speaking: green pulsing ring, active mic
 * - processing: yellow ring
 * - error: red ring
 * - not supported: red, disabled
 */
export function MicButton({ onToggle, isActive, isSupported }: MicButtonProps) {
  const vadState = useMediaStore((s) => s.vadState);

  if (!isSupported) {
    return (
      <button
        disabled
        className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center
                   cursor-not-allowed opacity-50"
        title="浏览器不支持语音识别"
      >
        <MicIcon className="text-red-400 w-5 h-5" />
      </button>
    );
  }

  const ringColor = !isActive
    ? 'ring-transparent'
    : vadState === 'speaking'
      ? 'ring-green-400 animate-pulse'
      : vadState === 'processing'
        ? 'ring-yellow-400'
        : vadState === 'listening'
          ? 'ring-primary-400'
          : 'ring-transparent';

  const bgColor = !isActive
    ? 'bg-surface-700 hover:bg-surface-600'
    : 'bg-primary-600 hover:bg-primary-700';

  const iconColor = !isActive ? 'text-surface-200' : 'text-white';

  return (
    <button
      onClick={onToggle}
      className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center
                 transition-all ring-2 ring-offset-2 ring-offset-surface-900 ${ringColor}
                 focus:outline-none active:scale-95`}
      title={isActive ? '停止录音' : '开始录音'}
    >
      <MicIcon className={`${iconColor} w-5 h-5`} />
    </button>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>
  );
}
