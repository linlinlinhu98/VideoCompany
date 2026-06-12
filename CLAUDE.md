# CLAUDE.md — AI Visual Conversation Assistant

## Project Overview
Browser-based app: camera + mic input → AI vision model → text + voice response.

## Commands
- `npm install` — Install deps for all workspaces
- `npm run dev` — Start client (Vite :5173) + server (Fastify :3001)
- `npm run build` — Build all packages
- `npm run typecheck` — Type-check all packages
- `npm run test` — Run all tests

## Architecture
- `shared/` — TypeScript types and constants consumed by both sides
- `client/` — React 19 + Vite + Tailwind + Zustand
  - `hooks/` — useCamera, useVAD, useSpeechRecognition, etc.
  - `components/` — VideoFeed, ChatPanel, MessageBubble, Settings
  - `stores/` — Zustand stores (media, conversation, cost, settings)
  - `providers/` — React context providers (WebSocket, Conversation, CostBudget)
- `server/` — Fastify + Socket.IO
  - `ws/` — WebSocket handlers and session store
  - `services/` — vision (Claude/OpenAI), cost, context, cache
  - `routes/` — REST endpoints (health, session)

## Key Patterns
- **Cost control**: 1fps frame capture, 512px JPEG Q60, pixel-diff dedup, tiered model routing
- **Local-first**: VAD, STT, TTS all run in-browser (free); only vision API costs money
- **Socket.IO**: Real-time bidirectional with auto-reconnect, auth middleware
- **Shared types**: `shared/src/types.ts` defines Message, Session, WS events — edit there first

## TypeScript
- Strict mode, ES2022 target, bundler module resolution
- No path aliases in `shared/`; `client/` uses `@/` alias
