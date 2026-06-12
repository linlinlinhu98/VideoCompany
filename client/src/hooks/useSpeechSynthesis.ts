import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * Browser support check for Web Speech Synthesis.
 */
export function isSpeechSynthesisSupported(): boolean {
  return !!window.speechSynthesis;
}

interface UseSpeechSynthesisOptions {
  /** Preferred voice language (e.g., 'zh-CN', 'en-US') */
  language?: string;
  /** Speech rate (0.1 - 10, default 1) */
  rate?: number;
  /** Speech pitch (0 - 2, default 1) */
  pitch?: number;
  /** Preferred voice name (partial match) */
  voiceName?: string;
}

interface UseSpeechSynthesisReturn {
  /** Speak the given text */
  speak: (text: string) => void;
  /** Stop speaking immediately */
  stop: () => void;
  /** Pause speaking */
  pause: () => void;
  /** Resume speaking */
  resume: () => void;
  /** Whether currently speaking */
  isSpeaking: boolean;
  /** Whether browser supports speech synthesis */
  isSupported: boolean;
  /** Available voices */
  voices: SpeechSynthesisVoice[];
}

/**
 * Hook wrapping the Web Speech API's SpeechSynthesis.
 *
 * Zero cloud cost — uses browser's built-in TTS engine.
 * Manages a queue so new speech cancels previous.
 */
export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {},
): UseSpeechSynthesisReturn {
  const { language, rate = 1, pitch = 1, voiceName } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(isSpeechSynthesisSupported);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices (they load async in Chrome)
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  /**
   * Find the best matching voice for the given criteria.
   */
  const findVoice = useCallback((): SpeechSynthesisVoice | null => {
    const available = voices.length > 0 ? voices : window.speechSynthesis?.getVoices() || [];

    // 1. Exact voice name match
    if (voiceName) {
      const exact = available.find((v) => v.name === voiceName);
      if (exact) return exact;
    }

    // 2. Language match (prefer default voice)
    if (language) {
      const langMatch = available.find(
        (v) => v.lang.startsWith(language) && v.default,
      ) || available.find((v) => v.lang.startsWith(language));
      if (langMatch) return langMatch;
    }

    // 3. Default voice
    const defaultVoice = available.find((v) => v.default);
    if (defaultVoice) return defaultVoice;

    // 4. Any available voice
    return available[0] || null;
  }, [voices, language, voiceName]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;

      // Cancel any current speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;

      const voice = findVoice();
      if (voice) utterance.voice = voice;
      if (language) utterance.lang = language;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = (event) => {
        console.warn('TTS error:', event.error);
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, rate, pitch, findVoice, language],
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsSpeaking(false);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setIsSpeaking(true);
  }, []);

  return { speak, stop, pause, resume, isSpeaking, isSupported, voices };
}
