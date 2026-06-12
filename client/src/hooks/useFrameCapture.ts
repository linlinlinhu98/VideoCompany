import { useRef, useCallback } from 'react';
import { useMediaStore } from '@/stores/useMediaStore';
import { captureFrame, blobToBase64, hashBase64, getThumbnailImageData, computeFrameDiff, shouldSendFrame } from '@/lib/frame-utils';
import { DEFAULT_FRAME_SIZE, JPEG_QUALITY } from 'shared';

interface UseFrameCaptureOptions {
  maxSize?: number;
  quality?: number;
  /** Interval in ms between automatic captures (default: 1000ms = 1fps) */
  captureInterval?: number;
}

/**
 * Hook that captures frames from a video element at a controlled rate,
 * performs pixel-difference detection to skip redundant frames,
 * and stores the latest frame data in Zustand.
 */
export function useFrameCapture(options: UseFrameCaptureOptions = {}) {
  const { maxSize = DEFAULT_FRAME_SIZE, quality = JPEG_QUALITY, captureInterval = 1000 } = options;

  const captureTimerRef = useRef<number | null>(null);
  const prevThumbnailRef = useRef<ImageData | null>(null);
  const lastSentHashRef = useRef<string | null>(null);

  const {
    cameraState,
    setLastFrame,
    lastFrameHash,
    incrementFrameCount,
  } = useMediaStore();

  /**
   * Capture the current frame from a video element.
   * Returns the captured data or null if frame was skipped (no change).
   */
  const captureCurrentFrame = useCallback(async (
    video: HTMLVideoElement,
  ): Promise<{ data: string; hash: string; width: number; height: number } | null> => {
    if (!video || video.readyState < 2) return null;

    try {
      // Get thumbnail for diff check
      const thumbData = getThumbnailImageData(video);

      // Check if frame changed enough
      if (prevThumbnailRef.current) {
        const diff = computeFrameDiff(prevThumbnailRef.current, thumbData);
        if (!shouldSendFrame(diff)) {
          return null; // Skipped — no significant change
        }
      }

      prevThumbnailRef.current = thumbData;

      // Capture full frame
      const { blob, width, height } = await captureFrame(video, maxSize, quality);
      const { data } = await blobToBase64(blob);
      const hash = hashBase64(data);

      // Skip if same as last sent
      if (hash === lastSentHashRef.current) return null;

      lastSentHashRef.current = hash;
      setLastFrame(data, hash, width, height);
      incrementFrameCount();

      return { data, hash, width, height };
    } catch (err) {
      console.error('Frame capture error:', err);
      return null;
    }
  }, [maxSize, quality, setLastFrame, incrementFrameCount]);

  /**
   * Start periodic frame capture from a video element.
   */
  const startCapturing = useCallback((video: HTMLVideoElement) => {
    if (captureTimerRef.current) return;

    // Capture immediately
    captureCurrentFrame(video);

    // Then capture at interval
    captureTimerRef.current = window.setInterval(() => {
      captureCurrentFrame(video);
    }, captureInterval);
  }, [captureInterval, captureCurrentFrame]);

  /**
   * Stop periodic frame capture.
   */
  const stopCapturing = useCallback(() => {
    if (captureTimerRef.current !== null) {
      clearInterval(captureTimerRef.current);
      captureTimerRef.current = null;
    }
  }, []);

  return {
    captureCurrentFrame,
    startCapturing,
    stopCapturing,
    lastFrameHash,
  };
}
