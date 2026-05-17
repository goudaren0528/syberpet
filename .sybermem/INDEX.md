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

<!-- add new conclusions here -->

## Change Records
| Number | Date | Title | Status | Link |
|--------|------|-------|--------|------|
<!-- add new records here -->

## Decision Records
| Number | Date | Title | Status | Link |
|--------|------|-------|--------|------|
<!-- add new records here -->

## Requirement Records
| Number | Date | Title | Status | Link |
|--------|------|-------|--------|------|
<!-- add new records here -->

## Bug Records
| Number | Date | Title | Status | Link |
|--------|------|-------|--------|------|
<!-- add new records here -->
