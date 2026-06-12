# AI 视觉对话助手 (AI Visual Conversation Assistant)

一款基于浏览器的 AI 视觉对话应用。打开摄像头和麦克风，AI 就能看到你眼前的画面、听到你说的话，并自然地用语音或文字回应你。

## 功能特性

- 🎥 **实时摄像头** — 浏览器原生 API，无需安装
- 🎤 **语音识别** — 自动检测语音活动 (VAD)，边说边识别
- 🧠 **视觉理解** — AI 分析摄像头画面，描述场景、物体、文字
- 🔊 **语音合成** — AI 用自然语音朗读回复
- 💰 **成本控制** — 本地 VAD/STT/TTS 零成本，仅视觉 API 按量计费
- 📊 **预算管理** — 每会话预算上限，实时费用展示

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS |
| 状态管理 | Zustand |
| 语音活动检测 | @ricky0123/vad-web (浏览器端 ONNX) |
| 语音识别/合成 | Web Speech API (默认免费) |
| 后端 | Node.js + Fastify 5 + Socket.IO 4 |
| AI SDK | Anthropic Claude / OpenAI GPT-4o |
| 实时通信 | WebSocket (Socket.IO) |

## 快速开始

### 1. 环境准备

- Node.js 22+
- npm 10+（启用 workspaces）

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 API 密钥

复制 `.env.example` 为 `.env`，填写至少一个 API 密钥：

```bash
cp .env.example .env
```

必填项：
- `ANTHROPIC_API_KEY` — Anthropic Claude API 密钥
- `OPENAI_API_KEY` — OpenAI API 密钥 (GPT-4o)

至少填写一个即可使用。

### 4. 启动开发服务器

```bash
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3001

### 5. 构建生产版本

```bash
npm run build
npm start -w server
```

## 项目结构

```
VideoCompany/
├── shared/          # 共享类型和常量
├── client/          # React 前端 (Vite)
│   └── src/
│       ├── hooks/       # 自定义 Hooks
│       ├── components/  # UI 组件
│       ├── stores/      # Zustand 状态
│       └── providers/   # React Context 提供者
├── server/          # Node.js 后端 (Fastify)
│   └── src/
│       ├── ws/          # WebSocket 处理
│       ├── services/    # AI 服务 (vision, speech, cost, context)
│       ├── routes/      # REST API
│       └── middleware/  # 中间件
└── .github/workflows/   # CI/CD
```

## 依赖说明

所有第三方依赖均在 `package.json` 中列明：

- **原创功能**：摄像头帧捕获与优化管线、VAD 驱动的语音交互流程、端云协同的模型路由策略、实时费用追踪与预算控制、多模态对话上下文管理——这些均为本项目原创实现。
- **第三方库**：React, Vite, Tailwind CSS, Zustand, Socket.IO, Fastify, Anthropic SDK, OpenAI SDK, Zod, Pino 等（详见各 `package.json` 的 `dependencies`）。

## License

MIT
