import { useRef, useCallback, useEffect } from 'react';
import { useMediaStore, type VadState } from '@/stores/useMediaStore';

/**
 * Voice Activity Detection hook.
 *
 * This is a hybrid approach:
 * - Primary: uses audio level from AnalyserNode (simple, no dependency)
 * - Optional: @ricky0123/vad-web for ML-based VAD (loaded dynamically)
 *
 * @ricky0123/vad-web is loaded on-demand to reduce initial bundle size.
 * If not available, falls back to energy-based detection via AnalyserNode.
 */

interface UseVADOptions {
  /** How long silence before considering speech ended (ms) */
  silenceTimeout?: number;
  /** Energy threshold for fallback VAD (0-1) */
  energyThreshold?: number;
  /** Minimum speech duration to count as valid speech (ms) */
  minSpeechDuration?: number;
  /** Called when speech starts */
  onSpeechStart?: () => void;
  /** Called when speech ends with accumulated audio */
  onSpeechEnd?: (audioData: Float32Array[]) => void;
}

export function useVAD(options: UseVADOptions = {}) {
  const {
    silenceTimeout = 1500,
    energyThreshold = 0.05,
    minSpeechDuration = 300,
    onSpeechStart,
    onSpeechEnd,
  } = options;

  const { micState, setVadState } = useMediaStore();

  const isSpeakingRef = useRef(false);
  const speechStartTimeRef = useRef(0);
  const silenceTimerRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const onSpeechStartRef = useRef(onSpeechStart);
  const onSpeechEndRef = useRef(onSpeechEnd);

  // Keep refs in sync
  useEffect(() => { onSpeechStartRef.current = onSpeechStart; }, [onSpeechStart]);
  useEffect(() => { onSpeechEndRef.current = onSpeechEnd; }, [onSpeechEnd]);

  const updateVadState = useCallback((state: VadState) => {
    setVadState(state);
  }, [setVadState]);

  /**
   * Energy-based VAD fallback. Uses AnalyserNode to detect speech energy.
   */
  const checkAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const value = (data[i] - 128) / 128;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / data.length);

    if (rms > energyThreshold) {
      if (!isSpeakingRef.current) {
        isSpeakingRef.current = true;
        speechStartTimeRef.current = Date.now();
        audioChunksRef.current = [];
        updateVadState('speaking');
        onSpeechStartRef.current?.();
      }
      // Reset silence timer
      if (silenceTimerRef.current !== null) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else if (isSpeakingRef.current) {
      if (silenceTimerRef.current === null) {
        silenceTimerRef.current = window.setTimeout(() => {
          const duration = Date.now() - speechStartTimeRef.current;
          if (duration >= minSpeechDuration) {
            updateVadState('processing');
            onSpeechEndRef.current?.(audioChunksRef.current);
          } else {
            updateVadState('idle');
          }
          isSpeakingRef.current = false;
          audioChunksRef.current = [];
          silenceTimerRef.current = null;
        }, silenceTimeout);
      }
    }
  }, [energyThreshold, silenceTimeout, minSpeechDuration, updateVadState]);

  /**
   * Initialize VAD with an existing microphone stream + AudioContext.
   * Sets up the ScriptProcessorNode to capture raw audio data.
   */
  const startVAD = useCallback((
    stream: MediaStream,
    audioContext: AudioContext,
    analyser?: AnalyserNode,
  ) => {
    audioContextRef.current = audioContext;
    if (analyser) analyserRef.current = analyser;

    // Create a ScriptProcessorNode to capture raw audio data for STT
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
    const source = audioContext.createMediaStreamSource(stream);

    scriptProcessor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      if (isSpeakingRef.current) {
        audioChunksRef.current.push(new Float32Array(inputData));
      }
    };

    source.connect(scriptProcessor);
    // Connect to a silent GainNode to keep the audio graph alive without feedback
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    scriptProcessor.connect(gainNode);
    gainNode.connect(audioContext.destination);
    scriptProcessorRef.current = scriptProcessor;

    // Start energy-based VAD polling
    pollIntervalRef.current = window.setInterval(checkAudioLevel, 100);
    updateVadState('listening');
  }, [checkAudioLevel, updateVadState]);

  /**
   * Stop VAD and clean up.
   */
  const stopVAD = useCallback(() => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    isSpeakingRef.current = false;
    audioChunksRef.current = [];
    updateVadState('idle');
  }, [updateVadState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current);
      if (pollIntervalRef.current !== null) clearInterval(pollIntervalRef.current);
      if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
    };
  }, []);

  return {
    startVAD,
    stopVAD,
    isSpeaking: isSpeakingRef,
  };
}
