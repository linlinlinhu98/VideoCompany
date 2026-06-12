import { useCallback, useState, useEffect } from 'react';
import { useMediaStore } from '@/stores/useMediaStore';
import { useConversationStore } from '@/stores/useConversationStore';
import { useCamera } from '@/hooks/useCamera';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useFrameCapture } from '@/hooks/useFrameCapture';
import { useVAD } from '@/hooks/useVAD';
import { useSpeechRecognition, isSpeechRecognitionSupported } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { PermissionGate } from '@/components/common/PermissionGate';
import { VideoFeed } from '@/components/video/VideoFeed';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { CostBadge } from '@/components/common/CostBadge';
import { ConnectionIndicator } from '@/components/common/ConnectionIndicator';
import type { Message } from 'shared';

let msgCounter = 0;
function genId(): string {
  return `msg_${Date.now()}_${++msgCounter}`;
}

export function App() {
  const isInitialized = useMediaStore((s) => s.isInitialized);
  const setInitialized = useMediaStore((s) => s.setInitialized);
  const cameraState = useMediaStore((s) => s.cameraState);
  const micState = useMediaStore((s) => s.micState);
  const lastFrameData = useMediaStore((s) => s.lastFrameData);
  const lastFrameHash = useMediaStore((s) => s.lastFrameHash);
  const lastFrameWidth = useMediaStore((s) => s.lastFrameWidth);
  const lastFrameHeight = useMediaStore((s) => s.lastFrameHeight);

  const addMessage = useConversationStore((s) => s.addMessage);

  const [isMicActive, setIsMicActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Camera
  const { videoRef, startCamera } = useCamera({
    facingMode: 'environment',
    maxResolution: 1280,
  });

  // Microphone
  const { startMicrophone, audioContext, analyser, micStream } = useMicrophone();

  // Frame capture
  const { startCapturing, captureCurrentFrame } = useFrameCapture({
    maxSize: 512,
    quality: 0.6,
    captureInterval: 1000,
  });

  // TTS
  const { speak, isSupported: ttsSupported } = useSpeechSynthesis({
    language: 'zh-CN',
    rate: 1,
  });

  // Speech recognition
  const {
    start: startSTT,
    stop: stopSTT,
    isListening: isSTTListening,
    isSupported: sttSupported,
  } = useSpeechRecognition({
    language: 'zh-CN',
    interimResults: true,
    onResult: (transcript) => {
      // Final transcript received — send as user message
      handleUserMessage(transcript);
    },
    onInterim: (interim) => {
      // Interim result — update status bar text
      useMediaStore.getState().setLastSpeechText(interim);
    },
    onError: (err) => {
      console.warn('STT error:', err);
    },
  });

  // VAD
  const { startVAD, stopVAD } = useVAD({
    silenceTimeout: 1500,
    energyThreshold: 0.05,
    onSpeechStart: () => {
      // When VAD detects speech, start STT
      startSTT();
    },
    onSpeechEnd: (audioChunks) => {
      // When VAD detects silence, stop STT
      stopSTT();
    },
  });

  /** Send user message to conversation store */
  const handleUserMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      const currentFrame = lastFrameData
        ? {
            data: lastFrameData,
            mimeType: 'image/jpeg' as const,
            width: lastFrameWidth,
            height: lastFrameHeight,
            hash: lastFrameHash || '',
            timestamp: Date.now(),
          }
        : undefined;

      const userMsg: Message = {
        id: genId(),
        role: 'user',
        text: text.trim(),
        frame: currentFrame,
        timestamp: Date.now(),
      };

      addMessage(userMsg);
      setIsProcessing(true);

      // Simulate AI response (Phase 3/4 will connect to real backend)
      simulateAIResponse(text, currentFrame);
    },
    [addMessage, lastFrameData, lastFrameHash, lastFrameWidth, lastFrameHeight],
  );

  /** Temporary: simulate AI response until backend is ready */
  const simulateAIResponse = useCallback(
    (userText: string, frame?: Message['frame']) => {
      setTimeout(() => {
        const hasFrame = frame ? '我看到你摄像头中的画面了。' : '';
        const responseText = `${hasFrame}你说："${userText}"。\n\n（这是本地模拟回复。Phase 3-4 将接入真实的 AI 视觉模型。）`;

        const aiMsg: Message = {
          id: genId(),
          role: 'assistant',
          text: responseText,
          timestamp: Date.now(),
          modelId: 'gpt-4o-mini',
          cost: 0.001,
        };

        addMessage(aiMsg);
        setIsProcessing(false);

        // Speak response
        if (ttsSupported) {
          speak(responseText);
        }
      }, 800);
    },
    [addMessage, speak, ttsSupported],
  );

  /** Handle mic button toggle */
  const handleMicToggle = useCallback(() => {
    if (isMicActive) {
      stopSTT();
      setIsMicActive(false);
    } else {
      startSTT();
      setIsMicActive(true);
    }
  }, [isMicActive, startSTT, stopSTT]);

  /** Handle text input */
  const handleSendText = useCallback(
    (text: string) => {
      handleUserMessage(text);
    },
    [handleUserMessage],
  );

  /** Initialize all media devices */
  const handleInitialize = useCallback(async () => {
    await startCamera();
    await startMicrophone();

    // Get mic resources from the store after startMicrophone completes
    const stream = useMediaStore.getState().micStream;

    // Start VAD after mic is active
    if (stream && audioContext.current) {
      startVAD(stream, audioContext.current, analyser.current || undefined);
    }

    // Start frame capture after camera is active
    if (videoRef.current) {
      startCapturing(videoRef.current);
    }

    setInitialized(true);
  }, [startCamera, startMicrophone, startVAD, startCapturing, videoRef, setInitialized]);

  if (!isInitialized) {
    return <PermissionGate onGranted={handleInitialize}><div /></PermissionGate>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 glass border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold tracking-tight">AI 视觉对话助手</h1>
          <div className="hidden sm:flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${
              cameraState === 'active' ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className={`w-1.5 h-1.5 rounded-full ${
              micState === 'active' ? 'bg-green-400' : micState === 'muted' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CostBadge />
          <ConnectionIndicator state="disconnected" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-4 p-0 lg:p-4 min-h-0">
        {/* Video panel */}
        <div className="lg:w-1/2 xl:w-2/5 flex-shrink-0 p-4 lg:p-0">
          <VideoFeed ref={videoRef} className="w-full aspect-video lg:h-full rounded-2xl" mirror={false} />
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-h-0">
          <ChatPanel
            onSendText={handleSendText}
            onMicToggle={handleMicToggle}
            isMicActive={isMicActive}
            disabled={isProcessing}
          />
        </div>
      </main>
    </div>
  );
}
