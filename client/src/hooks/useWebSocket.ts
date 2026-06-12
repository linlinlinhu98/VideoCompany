import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ClientMessagePayload,
  ServerResponsePayload,
  CostUpdatePayload,
  SessionInfo,
  ErrorPayload,
} from 'shared';
import { useConversationStore } from '@/stores/useConversationStore';
import { useCostStore } from '@/stores/useCostStore';
import { useMediaStore } from '@/stores/useMediaStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface UseWebSocketReturn {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  connectionState: ConnectionState;
  sendMessage: (payload: ClientMessagePayload) => void;
  updateSettings: (sessionId: string, modelTier?: string, budgetLimit?: number) => void;
  connect: (sessionId: string) => void;
  disconnect: () => void;
}

/**
 * Hook to manage the WebSocket connection lifecycle.
 * Handles connect/disconnect/reconnect and event routing.
 */
export function useWebSocket(): UseWebSocketReturn {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  const addMessage = useConversationStore((s) => s.addMessage);
  const setTotalCost = useCostStore((s) => s.setTotalCost);
  const setLastTurnCost = useCostStore((s) => s.setLastTurnCost);
  const setBudgetLimit = useCostStore((s) => s.setBudgetLimit);

  // Initialize socket on mount
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('connect', () => setConnectionState('connected'));
    socket.on('disconnect', () => setConnectionState('disconnected'));
    // reconnect_attempt is on the manager, not the socket
    socket.io.on('reconnect_attempt', () => setConnectionState('reconnecting'));
    socket.on('connect_error', () => setConnectionState('disconnected'));

    // Handle server responses
    socket.on('server:response', (payload: ServerResponsePayload) => {
      addMessage({
        id: payload.messageId,
        role: 'assistant',
        text: payload.text,
        timestamp: Date.now(),
        modelId: payload.modelId,
        cost: payload.cost,
      });
    });

    // Handle cost updates
    socket.on('server:cost-update', (payload: CostUpdatePayload) => {
      setTotalCost(payload.totalCost);
      setLastTurnCost(payload.lastTurnCost || 0);
      setBudgetLimit(payload.budgetLimit);
    });

    // Handle session info
    socket.on('server:session-info', (payload: SessionInfo) => {
      setTotalCost(payload.totalCost);
      setBudgetLimit(payload.budgetLimit);
    });

    // Handle errors
    socket.on('server:error', (payload: ErrorPayload) => {
      console.error('Server error:', payload.message);
      if (payload.budgetExceeded) {
        addMessage({
          id: `err_${Date.now()}`,
          role: 'system',
          text: `⚠️ ${payload.message}`,
          timestamp: Date.now(),
          isError: true,
        });
      }
    });

    return () => {
      socket.removeAllListeners();
    };
  }, []);

  const connect = useCallback((sessionId: string) => {
    const socket = socketRef.current;
    if (!socket) return;
    setConnectionState('connecting');
    socket.auth = { sessionId };
    socket.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    setConnectionState('disconnected');
  }, []);

  const sendMessage = useCallback((payload: ClientMessagePayload) => {
    socketRef.current?.emit('client:message', payload);
  }, []);

  const updateSettings = useCallback(
    (sessionId: string, modelTier?: string, budgetLimit?: number) => {
      socketRef.current?.emit('client:update-settings', {
        sessionId,
        modelTier: modelTier as any,
        budgetLimit,
      });
    },
    [],
  );

  return {
    socket: socketRef.current,
    connectionState,
    sendMessage,
    updateSettings,
    connect,
    disconnect,
  };
}
