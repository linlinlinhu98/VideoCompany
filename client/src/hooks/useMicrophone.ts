import { useRef, useCallback, useEffect } from 'react';
import { useMediaStore } from '@/stores/useMediaStore';

interface UseMicrophoneOptions {
  /** Echo cancellation */
  echoCancellation?: boolean;
  /** Noise suppression */
  noiseSuppression?: boolean;
}

/**
 * Hook to manage microphone access via getUserMedia.
 * Provides an AnalyserNode for VAD integration.
 */
export function useMicrophone(options: UseMicrophoneOptions = {}) {
  const { echoCancellation = true, noiseSuppression = true } = options;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const {
    micState,
    micStream,
    setMicState,
    setMicStream,
    setMicError,
  } = useMediaStore();

  const startMicrophone = useCallback(async () => {
    setMicState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation,
          noiseSuppression,
          sampleRate: { ideal: 16000 },
        },
      });

      // Create AudioContext for analysis
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      // Don't connect to destination to avoid feedback

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      setMicStream(stream);
      setMicState('active');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown microphone error';
      setMicError(message);
      throw err;
    }
  }, [echoCancellation, noiseSuppression, setMicState, setMicStream, setMicError]);

  const stopMicrophone = useCallback(() => {
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      setMicStream(null);
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setMicState('idle');
  }, [micStream, setMicStream, setMicState]);

  const muteMicrophone = useCallback(() => {
    if (micStream) {
      micStream.getAudioTracks().forEach((track) => (track.enabled = false));
      setMicState('muted');
    }
  }, [micStream, setMicState]);

  const unmuteMicrophone = useCallback(() => {
    if (micStream) {
      micStream.getAudioTracks().forEach((track) => (track.enabled = true));
      setMicState('active');
    }
  }, [micStream, setMicState]);

  /**
   * Get the current audio level (0-1) from the analyser.
   * Useful for VAD fallback or UI visualization.
   */
  const getAudioLevel = useCallback((): number => {
    if (!analyserRef.current) return 0;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const value = (data[i] - 128) / 128;
      sum += value * value;
    }
    return Math.sqrt(sum / data.length);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    micState,
    micStream,
    audioContext: audioContextRef,
    analyser: analyserRef,
    startMicrophone,
    stopMicrophone,
    muteMicrophone,
    unmuteMicrophone,
    getAudioLevel,
  };
}
