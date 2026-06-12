import { useRef, useCallback, useEffect } from 'react';
import { useMediaStore } from '@/stores/useMediaStore';

interface UseCameraOptions {
  /** Preferred facing mode */
  facingMode?: 'user' | 'environment';
  /** Preferred resolution (longest edge) */
  maxResolution?: number;
}

/**
 * Hook to manage camera access via getUserMedia.
 * Stores the MediaStream in Zustand for other hooks/components to consume.
 */
export function useCamera(options: UseCameraOptions = {}) {
  const { facingMode = 'environment', maxResolution = 1280 } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const {
    cameraState,
    cameraStream,
    setCameraState,
    setCameraStream,
    setCameraError,
  } = useMediaStore();

  const startCamera = useCallback(async () => {
    setCameraState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: maxResolution },
          height: { ideal: maxResolution },
        },
        audio: false,
      });

      setCameraStream(stream);
      setCameraState('active');

      // Auto-attach to video element if available
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown camera error';
      setCameraError(message);
      throw err;
    }
  }, [facingMode, maxResolution, setCameraState, setCameraStream, setCameraError]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setCameraState('idle');
    }
  }, [cameraStream, setCameraStream, setCameraState]);

  const pauseCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => (track.enabled = false));
      setCameraState('paused');
    }
  }, [cameraStream, setCameraState]);

  const resumeCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => (track.enabled = true));
      setCameraState('active');
    }
  }, [cameraStream, setCameraState]);

  const switchCamera = useCallback(async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    stopCamera();
    // Re-call startCamera with new facing mode — we use a fresh call
    setCameraState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newMode,
          width: { ideal: maxResolution },
          height: { ideal: maxResolution },
        },
        audio: false,
      });
      setCameraStream(stream);
      setCameraState('active');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown camera error';
      setCameraError(message);
    }
  }, [facingMode, maxResolution, stopCamera, setCameraState, setCameraStream, setCameraError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    cameraState,
    cameraStream,
    startCamera,
    stopCamera,
    pauseCamera,
    resumeCamera,
    switchCamera,
  };
}
