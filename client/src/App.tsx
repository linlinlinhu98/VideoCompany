import { useCallback } from 'react';
import { useMediaStore } from '@/stores/useMediaStore';
import { useCamera } from '@/hooks/useCamera';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useFrameCapture } from '@/hooks/useFrameCapture';
import { useVAD } from '@/hooks/useVAD';
import { PermissionGate } from '@/components/common/PermissionGate';
import { VideoFeed } from '@/components/video/VideoFeed';

export function App() {
  const isInitialized = useMediaStore((s) => s.isInitialized);
  const setInitialized = useMediaStore((s) => s.setInitialized);

  const { videoRef, startCamera, cameraState } = useCamera({
    facingMode: 'environment',
    maxResolution: 1280,
  });

  const { startMicrophone, micState } = useMicrophone();

  const { startCapturing, stopCapturing } = useFrameCapture({
    maxSize: 512,
    quality: 0.6,
    captureInterval: 1000,
  });

  const { startVAD, stopVAD } = useVAD({
    silenceTimeout: 1500,
    energyThreshold: 0.05,
    onSpeechStart: () => {
      console.log('[VAD] Speech started');
    },
    onSpeechEnd: (audioChunks) => {
      console.log('[VAD] Speech ended, chunks:', audioChunks.length);
      // Phase 2 will handle STT here
    },
  });

  /** Initialize all media devices */
  const handleInitialize = useCallback(async () => {
    // Request both camera and microphone
    await startCamera();
    const micResult = await startMicrophone();

    // Start VAD with the microphone stream + audio context
    // We need to access the mic internals — for now, set up after mic is active
    // (VAD integration will be refined in Phase 2)

    // Start frame capture
    if (videoRef.current) {
      startCapturing(videoRef.current);
    }

    setInitialized(true);
  }, [startCamera, startMicrophone, startCapturing, videoRef, setInitialized]);

  // Show permission gate if not yet initialized
  if (!isInitialized) {
    return (
      <PermissionGate onGranted={handleInitialize}>
        <div />
      </PermissionGate>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 glass border-b border-white/5">
        <h1 className="text-sm font-semibold tracking-tight">AI 视觉对话助手</h1>
        <div className="flex items-center gap-3">
          {/* Camera status */}
          <span className={`w-2 h-2 rounded-full ${
            cameraState === 'active' ? 'bg-green-400' :
            cameraState === 'paused' ? 'bg-yellow-400' :
            'bg-red-400'
          }`} />
          <span className="text-xs text-surface-200">
            {cameraState === 'active' ? '摄像头已就绪' :
             cameraState === 'paused' ? '已暂停' : '摄像头未连接'}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">
        {/* Video panel */}
        <div className="lg:w-1/2 xl:w-2/5 flex-shrink-0">
          <VideoFeed ref={videoRef} className="w-full aspect-video lg:h-full" mirror={false} />
        </div>

        {/* Chat panel placeholder — Phase 2 */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex items-center justify-center rounded-2xl bg-surface-800/30 border border-white/5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     className="text-primary-400" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
              </div>
              <p className="text-sm text-surface-200">
                {micState === 'active' ? '麦克风已就绪，开始说话吧' :
                 micState === 'muted' ? '麦克风已静音' : '麦克风未连接'}
              </p>
              <p className="text-xs text-surface-200/60 mt-1">
                Phase 2 — 聊天界面即将上线
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Status bar */}
      <footer className="px-4 py-2 glass border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-surface-200">
          <span>
            📸 {cameraState} | 🎤 {micState} | 帧数: {useMediaStore.getState().frameCount}
          </span>
          <span>Phase 1 — Media Pipeline</span>
        </div>
      </footer>
    </div>
  );
}
