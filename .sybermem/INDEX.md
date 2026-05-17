# SyberMem Project Index — SyberPet

## Key Conclusions

- **Tech Stack**: Electron 28 + React 18 + TypeScript 5 + Vite 5 + PixiJS 8 + Zustand 4 + electron-builder
- **Architecture**: Electron main process hosts Agent Core (LLM client + short-term memory + conversation manager), renderer process hosts React UI + PixiJS Live2D canvas; IPC bridge connects them (`shared/types.ts`)
- **Agent Core**: MessageBus (pub/sub by message type) → PriorityQueue (P0-P3) → AgentCore orchestration (`agent/index.ts:24`)
- **LLM**: Multi-provider client with configurable models via `agent-config.json` — default model deepseek-v4-pro on OpenCode API (`agent/llm/`)
- **Live2D rendering**: Migrated from PixiJS v6 to v8 for ESM/Vite compatibility (`d6efd85`), uses `pixi-live2d-display` library (`renderer/pet/engine.ts`)
- **Styling**: TailwindCSS removed (`4710348`); project uses inline React styles exclusively
- **State management**: Single Zustand store with `chatVisible`, `petState`, `toggleChat`, `setPetState` (`renderer/store/state.ts`)
- **Window management**: Frameless transparent Electron window with drag-to-move, tray icon, devtools auto-open (`electron/main.ts`, `electron/tray.ts`)
- **API keys**: Managed via `.env` (dotenv) with `.env.example` for template
- **Development**: `npm run dev` (or `npm run electron:dev`) uses Vite + vite-plugin-electron for hot reload
- **Git history (7 commits)**: Phase 1 MVP scaffold → PixiJS v8 migration → Tailwind removal → window visibility fixes → model selector feature
- **Existing plan**: `docs/superpowers/plans/2026-01-16-syberpet-core.md` defines Phase 1-3 roadmap (MVP → Intelligence → Ecosystem)

- **Bug fix**: `contextBridge.exposeInMainWorld` API properties are read-only; `onAgentStream`/`onAgentStreamEnd` must be called as functions with callbacks, not reassigned (`App.tsx:90`) — same pattern as `ChatPanel.tsx:93`
- [change-001] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
- **Requirement**: Renderer runtime cleanup should be handled as a full IPC/lifecycle stabilization effort, not a narrow patch, to eliminate recurring startup-time runtime errors (2026-05-17)
- [change-002] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
- [change-003] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
- [change-004] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
- **Bug fix**: Windows 下无边框透明窗口 `resizable:true` 导致拖动变大（WS_THICKFRAME 冲突），改为 `false`；拖动与点击手势冲突通过 5px 阈值 + `didDrag` 标志区分 (2026-05-17)
- **Pet appearance**: 宠物形象从纯色椭圆 blob 升级为奶油色猫咪（猫耳/猫鼻/w嘴/胡须/肉垫/摇摆尾巴），5种状态独立暖色配色 (2026-05-17)
- [change-006] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
- **Bug fix**: ChatPanel 关闭按钮 click 事件冒泡到 App 层触发 `toggleChat()` 导致聊天面板关闭后立即重新打开，通过 `stopPropagation` 隔离解决 (2026-05-17)
- **Window size**: 窗口防胀方案从运行时纠正（setSize/setBounds/will-resize）改为 `minWidth/maxWidth/minHeight/maxHeight` 原生 Win32 约束，经历 6 轮迭代确定最可靠方案 (2026-05-17)
- **Change**: 聊天面板改为固定高度，并接入桌宠气泡、needs HUD 与 `pet-data.json` 本地持久化，以先稳定拖动时视觉表现并补齐最小养成闭环 (2026-05-17)
- [change-009] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
- **Bug fix**: 透明无边框窗口拖动改为基于 `screenX/screenY` 计算增量并恢复 5px 阈值 + `didDrag` 语义，以消除窗口移动时的坐标漂移并避免拖动后误触聊天切换 (2026-05-17)
- **Change**: 主交互改为底部轻量输入条 + 宠物气泡回复，并补上 stream 监听清理与 position-only 拖动，以让桌宠交互更轻、更稳、更接近真实桌面宠物体验 (2026-05-17)
- [change-011] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
- [change-012] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
- [change-013] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
- [change-014] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
- [change-015] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
- **Bug fix**: 透明无边框窗口拖动时若原生层偷偷放大内容区，就在 main process 用 `setContentSize` 纠正到固定 400x500，因为问题在窗口层而不是 UI 层 (2026-05-17)
- [change-016] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
- **Bug fix**: `InputBar` 聊天态与设置态使用不同 key 强制重新挂载，因为两个语义不同的 input 被 React 复用后会触发 uncontrolled → controlled 警告 (2026-05-17)
- [change-017] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
- [change-018] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
- **Change**: `CLAUDE.md` 重构为项目工作规范并提炼出通用模板，因为需要把搜索前置、验证、commit、README 同步和 SyberMem 记录沉淀为可复用协作约束 (2026-05-17)
- [change-020] Auto-recorded workspace file changes at session stop so the project keeps a lightweight change trail without manual recording (2026-05-17)
<!-- add new conclusions here -->

## Change Records
| Number | Date | Title | Status | Link |
|--------|------|-------|--------|------|
| 001 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-001-app-vite-env-d.md) |
| 002 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-002-app-2026-05-17-renderer-runtime-cleanup-design-vite-env-d.md) |
| 003 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-003-app-2026-05-17-renderer-runtime-cleanup-2026-05-17-renderer-runtime-cleanup-design-and-more.md) |
| 004 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-004-main-app-engine-and-more.md) |
| 005 | 2026-05-17 | 宠物形象从紫色 blob 升级为精致猫咪角色 | implemented | [link](changes/2026-05-17-005-pet-appearance-upgrade.md) |
| 006 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-006-main-app-engine-and-more.md) |
| 007 | 2026-05-17 | 窗口大小锁定方案重构 — 从运行时纠正改为原生约束 | implemented | [link](changes/2026-05-17-007-window-size-lock-and-move-fix.md) |
| 008 | 2026-05-17 | 桌宠气泡与成长系统接入，并稳定聊天面板交互 | implemented | [link](changes/2026-05-17-008-pet-bubble-needs-and-chat-panel-stability.md) |
| 009 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-009-main-preload-app-and-more.md) |
| 010 | 2026-05-17 | 轻量输入条、宠物气泡回复与拖动稳定性重构 | implemented | [link](changes/2026-05-17-010-lightweight-input-bubble-and-drag-stability.md) |
| 011 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-011-main-preload-app-and-more.md) |
| 012 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-012-engine-chatpanel-2026-05-17-renderer-runtime-cleanup-and-more.md) |
| 013 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-013-main-preload-app-and-more.md) |
| 014 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-014-main-preload-app-and-more.md) |
| 015 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-015-main-preload-app-and-more.md) |
| 016 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-016-inputbar.md) |
| 017 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-017-agent-config.md) |
| 018 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-018-agent-config-main.md) |
| 019 | 2026-05-17 | 项目工作规范重构，并提炼可复用通用模板 | implemented | [link](changes/2026-05-17-019-working-rules-and-generic-template.md) |
| 020 | 2026-05-17 | Auto-record workspace file changes on stop | implemented | [link](changes/2026-05-17-020-agent-config-manager-main-and-more.md) |
<!-- add new records here -->

## Decision Records
| Number | Date | Title | Status | Link |
|--------|------|-------|--------|------|
<!-- add new records here -->

## Requirement Records
| Number | Date | Title | Status | Link |
|--------|------|-------|--------|------|
| 001 | 2026-05-17 | 全面清理渲染层运行时错误与 IPC 交互边界 | confirmed | [requirement-001](requirements/2026-05-17-001-renderer-runtime-cleanup.md) |
<!-- add new records here -->

## Bug Records
| Number | Date | Title | Status | Link |
|--------|------|-------|--------|------|
| 001 | 2026-05-17 | App.tsx 中对 contextBridge API 进行只读属性赋值导致运行时崩溃 | resolved | [bug-001](bugs/2026-05-17-001-react-readonly-onAgentStream.md) |
| 002 | 2026-05-17 | 无边框透明窗口拖动时持续变大 + 拖动与点击手势冲突 | resolved | [bug-002](bugs/2026-05-17-002-window-grows-on-drag.md) |
| 003 | 2026-05-17 | ChatPanel 关闭按钮点击冒泡导致聊天面板立即重新打开 | resolved | [bug-003](bugs/2026-05-17-003-chat-click-bubbling-reopen.md) |
| 004 | 2026-05-17 | 透明无边框窗口拖动时坐标漂移与跟手不稳 | resolved | [bug-004](bugs/2026-05-17-004-window-drag-drift-and-flicker.md) |
| 005 | 2026-05-17 | 透明无边框窗口拖动时窗口尺寸在移动过程中持续膨胀 | resolved | [bug-005](bugs/2026-05-17-005-transparent-window-resizes-during-drag.md) |
| 006 | 2026-05-17 | InputBar 切换设置时复用 input 节点触发受控状态警告 | resolved | [bug-006](bugs/2026-05-17-006-inputbar-controlled-uncontrolled-toggle.md) |
<!-- add new records here -->
