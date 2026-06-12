import { create } from 'zustand';
import type { ModelTier } from 'shared';
import { DEFAULT_BUDGET } from 'shared';

interface SettingsStore {
  /** Selected model tier */
  modelTier: ModelTier;
  /** Use cloud TTS instead of browser TTS */
  useCloudTTS: boolean;
  /** Use cloud STT instead of browser STT */
  useCloudSTT: boolean;
  /** Per-session budget limit in USD */
  budgetLimit: number;
  /** Speech rate for TTS */
  ttsRate: number;
  /** Auto-speak responses */
  autoSpeak: boolean;
  /** Camera facing mode */
  facingMode: 'user' | 'environment';

  // Actions
  setModelTier: (tier: ModelTier) => void;
  setUseCloudTTS: (val: boolean) => void;
  setUseCloudSTT: (val: boolean) => void;
  setBudgetLimit: (limit: number) => void;
  setTtsRate: (rate: number) => void;
  setAutoSpeak: (val: boolean) => void;
  setFacingMode: (mode: 'user' | 'environment') => void;
}

const STORAGE_KEY = 'ai-visual-assistant-settings';

/**
 * Load persisted settings from localStorage.
 */
function loadSettings(): Partial<SettingsStore> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Corrupted settings — ignore
  }
  return {};
}

/**
 * Persist settings to localStorage.
 */
function saveSettings(state: SettingsStore) {
  try {
    const { ...data } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

const defaults = {
  modelTier: 'budget' as ModelTier,
  useCloudTTS: false,
  useCloudSTT: false,
  budgetLimit: DEFAULT_BUDGET,
  ttsRate: 1,
  autoSpeak: true,
  facingMode: 'environment' as const,
};

export const useSettingsStore = create<SettingsStore>((set) => {
  const persisted = loadSettings();

  return {
    ...defaults,
    ...persisted,

    setModelTier: (modelTier) => set((s) => { saveSettings({ ...s, modelTier }); return { modelTier }; }),
    setUseCloudTTS: (useCloudTTS) => set((s) => { saveSettings({ ...s, useCloudTTS }); return { useCloudTTS }; }),
    setUseCloudSTT: (useCloudSTT) => set((s) => { saveSettings({ ...s, useCloudSTT }); return { useCloudSTT }; }),
    setBudgetLimit: (budgetLimit) => set((s) => { saveSettings({ ...s, budgetLimit }); return { budgetLimit }; }),
    setTtsRate: (ttsRate) => set((s) => { saveSettings({ ...s, ttsRate }); return { ttsRate }; }),
    setAutoSpeak: (autoSpeak) => set((s) => { saveSettings({ ...s, autoSpeak }); return { autoSpeak }; }),
    setFacingMode: (facingMode) => set((s) => { saveSettings({ ...s, facingMode }); return { facingMode }; }),
  };
});
