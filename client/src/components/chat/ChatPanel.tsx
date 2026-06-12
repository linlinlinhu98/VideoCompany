import { MessageList } from './MessageList';
import { InputBar } from './InputBar';
import { StatusBar } from './StatusBar';
import { useConversationStore } from '@/stores/useConversationStore';
import type { Message } from 'shared';

interface ChatPanelProps {
  /** Called when user sends a text message */
  onSendText: (text: string) => void;
  /** Called when mic button is toggled */
  onMicToggle: () => void;
  /** Whether mic is currently active */
  isMicActive: boolean;
  /** Whether input is disabled */
  disabled?: boolean;
}

/**
 * Main chat panel composing message list, status bar, and input bar.
 */
export function ChatPanel({
  onSendText,
  onMicToggle,
  isMicActive,
  disabled = false,
}: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full rounded-2xl bg-surface-800/30 border border-white/5 overflow-hidden">
      {/* Status bar */}
      <StatusBar />

      {/* Messages */}
      <MessageList />

      {/* Input */}
      <InputBar
        onSendText={onSendText}
        onMicToggle={onMicToggle}
        isMicActive={isMicActive}
        disabled={disabled}
      />
    </div>
  );
}
