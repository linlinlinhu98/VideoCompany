import { useRef, useCallback } from 'react';
import { getThumbnailImageData, computeFrameDiff, shouldSendFrame } from '@/lib/frame-utils';
import { FRAME_DIFF_THRESHOLD } from 'shared';

/**
 * Lightweight hook for on-demand frame difference checking.
 * Used when you want to check if a frame has changed before processing,
 * without the full capture pipeline.
 */
export function useFrameDiff(threshold: number = FRAME_DIFF_THRESHOLD) {
  const prevThumbRef = useRef<ImageData | null>(null);

  const hasChanged = useCallback((video: HTMLVideoElement): boolean => {
    if (!video || video.readyState < 2) return false;

    const current = getThumbnailImageData(video);
    if (!prevThumbRef.current) {
      prevThumbRef.current = current;
      return true; // First frame always counts as changed
    }

    const diff = computeFrameDiff(prevThumbRef.current, current);
    prevThumbRef.current = current;
    return shouldSendFrame(diff, threshold);
  }, [threshold]);

  const reset = useCallback(() => {
    prevThumbRef.current = null;
  }, []);

  return { hasChanged, reset };
}
