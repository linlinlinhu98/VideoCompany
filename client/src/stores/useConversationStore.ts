import { create } from 'zustand';
import type { Message, Turn, ModelTier } from 'shared';

interface ConversationStore {
  /** All messages in the conversation */
  messages: Message[];
  /** Conversation turns */
  turns: Turn[];
  /** Current session ID from server */
  sessionId: string | null;

  // Actions
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  addTurn: (turn: Turn) => void;
  setSessionId: (id: string) => void;
  setMessages: (messages: Message[]) => void;
  clearConversation: () => void;

  // Computed
  lastUserMessage: () => Message | undefined;
  lastAssistantMessage: () => Message | undefined;
}

let messageCounter = 0;
function generateId(): string {
  return `msg_${Date.now()}_${++messageCounter}`;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  messages: [],
  turns: [],
  sessionId: null,

  addMessage: (message) => {
    const msg = { ...message, id: message.id || generateId() };
    set((s) => ({ messages: [...s.messages, msg] }));
  },

  updateMessage: (id, updates) => {
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  },

  addTurn: (turn) => {
    set((s) => ({ turns: [...s.turns, turn] }));
  },

  setSessionId: (sessionId) => set({ sessionId }),
  setMessages: (messages) => set({ messages }),
  clearConversation: () => set({ messages: [], turns: [] }),

  lastUserMessage: () => {
    const messages = get().messages;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i];
    }
    return undefined;
  },

  lastAssistantMessage: () => {
    const messages = get().messages;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i];
    }
    return undefined;
  },
}));
