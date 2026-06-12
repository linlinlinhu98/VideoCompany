import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Browser support check for Web Speech API.
 */
export function isSpeechRecognitionSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

interface UseSpeechRecognitionOptions {
  /** Language for recognition (default: auto-detect from browser) */
  language?: string;
  /** Whether to show interim results */
  interimResults?: boolean;
  /** Called when a final transcript is available */
  onResult?: (transcript: string, confidence: number) => void;
  /** Called when interim results update */
  onInterim?: (transcript: string) => void;
  /** Called on recognition error */
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  /** Start listening */
  start: () => void;
  /** Stop listening and finalize */
  stop: () => void;
  /** Abort listening without finalizing */
  abort: () => void;
  /** Whether currently listening */
  isListening: boolean;
  /** Whether browser supports speech recognition */
  isSupported: boolean;
  /** Last error message */
  error: string | null;
}

/**
 * Hook wrapping the Web Speech API's SpeechRecognition.
 *
 * Zero cloud cost — everything runs locally in the browser.
 * Falls back gracefully if not supported (e.g., Firefox).
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  const {
    language,
    interimResults = true,
    onResult,
    onInterim,
    onError,
  } = options;

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(isSpeechRecognitionSupported);
  const [error, setError] = useState<string | null>(null);

  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  const onErrorRef = useRef(onError);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onInterimRef.current = onInterim; }, [onInterim]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = interimResults;
    if (language) recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      let confidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0]?.transcript || '';
          confidence = Math.max(confidence, result[0]?.confidence || 0);
        } else {
          interim += result[0]?.transcript || '';
        }
      }

      if (final) {
        onResultRef.current?.(final.trim(), confidence);
      }
      if (interim) {
        onInterimRef.current?.(interim.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const message = event.error === 'no-speech'
        ? '未检测到语音'
        : event.error === 'aborted'
          ? '识别已取消'
          : event.error === 'not-allowed'
            ? '麦克风权限未授予'
            : `语音识别错误: ${event.error}`;

      setError(message);
      onErrorRef.current?.(event.error);

      // Don't stop on 'no-speech' — let it keep listening
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isSupported, interimResults, language]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      // May already be started — ignore
      const message = err instanceof Error ? err.message : 'Failed to start';
      setError(message);
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const abort = useCallback(() => {
    recognitionRef.current?.abort();
    setIsListening(false);
  }, []);

  return { start, stop, abort, isListening, isSupported, error };
}
