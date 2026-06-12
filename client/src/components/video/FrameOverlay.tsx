import { useMediaStore } from '@/stores/useMediaStore';

/**
 * Overlay that appears briefly when a frame is captured.
 * Shows a subtle flash effect to give user feedback.
 */
export function CaptureFlash() {
  const frameCount = useMediaStore((s) => s.frameCount);
  const lastFrameData = useMediaStore((s) => s.lastFrameData);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Flash effect on capture — keyed on frameCount for animation reset */}
      {lastFrameData && (
        <div
          key={frameCount}
          className="absolute inset-0 bg-white/10 animate-fade-in rounded-2xl"
          style={{ animationDuration: '0.5s' }}
        />
      )}
    </div>
  );
}
