import { useState } from 'react';

export function App() {
  const [initialized, setInitialized] = useState(false);

  if (!initialized) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               className="text-primary-500" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z"/>
            <path d="M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"/>
            <circle cx="12" cy="12" r="1.5"/>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI 视觉对话助手</h1>
          <p className="mt-2 text-surface-200 max-w-md">
            打开摄像头和麦克风，让 AI 看到你眼前的画面，听到你说的话，并给予自然的语音回应。
          </p>
        </div>
        <button
          onClick={() => setInitialized(true)}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl font-medium
                     transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        >
          开始对话
        </button>
        <p className="text-xs text-surface-200 mt-4">
          Phase 0 — Project Scaffolding
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-surface-200">App initialized — more to come in Phase 1!</p>
    </div>
  );
}
