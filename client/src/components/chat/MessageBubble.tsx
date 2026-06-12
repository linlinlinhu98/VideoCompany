import type { Message } from 'shared';
import { formatCost } from '@/lib/format-cost';

interface MessageBubbleProps {
  message: Message;
  /** Whether to show frame thumbnail (user messages only) */
  showFrame?: boolean;
}

/**
 * A single chat bubble displaying a message.
 * - User messages: right-aligned, blue
 * - Assistant messages: left-aligned, dark
 * - Error messages: red tint
 * - Shows cost badge on assistant messages
 */
export function MessageBubble({ message, showFrame = true }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isError
            ? 'bg-red-500/10 border border-red-500/20 text-red-200'
            : isUser
              ? 'bg-primary-600 text-white'
              : 'bg-surface-800 text-surface-50'
        }`}
      >
        {/* Frame thumbnail (user messages only) */}
        {isUser && showFrame && message.frame && (
          <div className="mb-2 rounded-lg overflow-hidden">
            <img
              src={`data:${message.frame.mimeType};base64,${message.frame.data}`}
              alt="Captured frame"
              className="w-full max-w-[200px] h-auto rounded"
              loading="lazy"
            />
            <div className="text-[10px] text-white/50 mt-0.5">
              {message.frame.width}×{message.frame.height}
            </div>
          </div>
        )}

        {/* Text content */}
        <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isError ? 'text-red-200' : ''
        }`}>
          {message.text || (isUser ? '（空消息）' : '...')}
        </p>

        {/* Metadata row */}
        <div className={`flex items-center gap-2 mt-1.5 text-[10px] ${
          isUser ? 'text-white/50' : 'text-surface-200'
        }`}>
          {message.cost !== undefined && message.cost > 0 && (
            <span className="font-mono" title="此回复的 API 费用">
              {formatCost(message.cost)}
            </span>
          )}
          {message.modelId && (
            <span className="opacity-60">{message.modelId}</span>
          )}
        </div>
      </div>
    </div>
  );
}
