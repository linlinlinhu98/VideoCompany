import { forwardRef } from 'react';
import { useMediaStore } from '@/stores/useMediaStore';

interface VideoFeedProps {
  /** Additional class name */
  className?: string;
  /** Mirror the video (for front-facing camera) */
  mirror?: boolean;
}

/**
 * Renders the live camera feed in a <video> element.
 * Accepts a forwarded ref so parent hooks can attach to the video element.
 */
export const VideoFeed = forwardRef<HTMLVideoElement, VideoFeedProps>(
  function VideoFeed({ className = '', mirror = false }, ref) {
    const cameraState = useMediaStore((s) => s.cameraState);

    const isActive = cameraState === 'active';

    return (
      <div className={`relative overflow-hidden bg-black rounded-2xl ${className}`}>
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${mirror ? '-scale-x-100' : ''}`}
        />

        {/* Camera state overlay */}
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-900/90">
            {cameraState === 'idle' && (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     className="text-surface-200 mb-3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z"/>
                  <path d="M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"/>
                  <circle cx="12" cy="12" r="1.5"/>
                </svg>
                <p className="text-sm text-surface-200">摄像头未启动</p>
              </>
            )}
            {cameraState === 'requesting' && (
              <>
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-surface-200">正在请求摄像头权限...</p>
              </>
            )}
            {cameraState === 'paused' && (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     className="text-yellow-400 mb-3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
                <p className="text-sm text-surface-200">摄像头已暂停</p>
              </>
            )}
            {cameraState === 'error' && (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     className="text-red-400 mb-3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-sm text-red-400">摄像头错误</p>
              </>
            )}
          </div>
        )}

        {/* Frame capture indicator */}
        <FrameOverlay />
      </div>
    );
  },
);

/**
 * Small overlay showing frame capture status.
 */
function FrameOverlay() {
  const cameraState = useMediaStore((s) => s.cameraState);
  const frameCount = useMediaStore((s) => s.frameCount);
  const vadState = useMediaStore((s) => s.vadState);

  if (cameraState !== 'active') return null;

  return (
    <div className="absolute top-3 left-3 flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${
        vadState === 'speaking' ? 'bg-green-400 animate-pulse' :
        vadState === 'processing' ? 'bg-yellow-400' :
        'bg-red-400'
      }`} />
      <span className="text-xs text-white/70 font-mono">
        {frameCount > 0 ? `${frameCount} 帧` : '就绪'}
      </span>
    </div>
  );
}
