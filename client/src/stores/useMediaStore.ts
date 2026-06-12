import { create } from 'zustand';

/** Voice activity detection states */
export type VadState = 'idle' | 'listening' | 'speaking' | 'processing' | 'error';

/** Camera connection state */
export type CameraState = 'idle' | 'requesting' | 'active' | 'paused' | 'error';

/** Microphone connection state */
export type MicState = 'idle' | 'requesting' | 'active' | 'muted' | 'error';

interface MediaStore {
  // Camera
  cameraState: CameraState;
  cameraStream: MediaStream | null;
  cameraError: string | null;
  setCameraState: (state: CameraState) => void;
  setCameraStream: (stream: MediaStream | null) => void;
  setCameraError: (error: string | null) => void;

  // Microphone
  micState: MicState;
  micStream: MediaStream | null;
  micError: string | null;
  setMicState: (state: MicState) => void;
  setMicStream: (stream: MediaStream | null) => void;
  setMicError: (error: string | null) => void;

  // VAD
  vadState: VadState;
  lastSpeechText: string;
  setVadState: (state: VadState) => void;
  setLastSpeechText: (text: string) => void;

  // Frame capture
  lastFrameData: string | null;         // base64 JPEG data
  lastFrameHash: string | null;
  lastFrameWidth: number;
  lastFrameHeight: number;
  frameCount: number;
  setLastFrame: (data: string, hash: string, width: number, height: number) => void;
  incrementFrameCount: () => void;

  // Global
  isInitialized: boolean;
  setInitialized: (val: boolean) => void;

  reset: () => void;
}

const initialState = {
  cameraState: 'idle' as CameraState,
  cameraStream: null,
  cameraError: null,
  micState: 'idle' as MicState,
  micStream: null,
  micError: null,
  vadState: 'idle' as VadState,
  lastSpeechText: '',
  lastFrameData: null,
  lastFrameHash: null,
  lastFrameWidth: 0,
  lastFrameHeight: 0,
  frameCount: 0,
  isInitialized: false,
};

export const useMediaStore = create<MediaStore>((set) => ({
  ...initialState,

  setCameraState: (cameraState) => set({ cameraState }),
  setCameraStream: (cameraStream) => set({ cameraStream }),
  setCameraError: (cameraError) => set({ cameraError, cameraState: 'error' }),

  setMicState: (micState) => set({ micState }),
  setMicStream: (micStream) => set({ micStream }),
  setMicError: (micError) => set({ micError, micState: 'error' }),

  setVadState: (vadState) => set({ vadState }),
  setLastSpeechText: (lastSpeechText) => set({ lastSpeechText }),

  setLastFrame: (data, hash, width, height) =>
    set({ lastFrameData: data, lastFrameHash: hash, lastFrameWidth: width, lastFrameHeight: height }),
  incrementFrameCount: () => set((s) => ({ frameCount: s.frameCount + 1 })),

  setInitialized: (isInitialized) => set({ isInitialized }),

  reset: () => set(initialState),
}));
