import { useState, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { MicButton } from './MicButton';
import { isSpeechRecognitionSupported } from '@/hooks/useSpeechRecognition';

interface InputBarProps {
  /** Called when user sends a text message */
  onSendText: (text: string) => void;
  /** Called when mic button is toggled */
  onMicToggle: () => void;
  /** Whether mic is currently active */
  isMicActive: boolean;
  /** Whether input is disabled (e.g., during processing) */
  disabled?: boolean;
}

/**
 * Bottom input bar with text input, mic button, and send button.
 */
export function InputBar({
  onSendText,
  onMicToggle,
  isMicActive,
  disabled = false,
}: InputBarProps) {
  const [text, setText] = useState('');
  const speechSupported = isSpeechRecognitionSupported();

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || disabled) return;
      onSendText(trimmed);
      setText('');
    },
    [text, disabled, onSendText],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-4 py-3 glass border-t border-white/5"
    >
      {/* Mic button */}
      <MicButton
        onToggle={onMicToggle}
        isActive={isMicActive}
        isSupported={speechSupported}
      />

      {/* Text input */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? '处理中...' : '输入消息，或点击麦克风说话...'}
        className="flex-1 bg-surface-800/50 border border-white/10 rounded-xl px-4 py-2.5
                   text-sm text-white placeholder-surface-200
                   focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
      />

      {/* Send button */}
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-700
                   disabled:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center transition-colors
                   focus:outline-none focus:ring-2 focus:ring-primary-500/50
                   active:scale-95"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             className="text-white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </form>
  );
}
