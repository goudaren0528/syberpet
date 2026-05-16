# SyberPet Core MVP 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 Electron 桌面 AI 桌宠 MVP —— Live2D 角色 + LLM 对话 + 短期记忆

**Architecture:** Electron 主进程承载 Agent Core（LLM客户端+记忆+对话管理），渲染进程承载 Live2D 渲染 + React UI。通过 typed IPC 通道双向通信。

**Tech Stack:** Electron + React + TypeScript + Vite + PixiJS + Live2D Cubism SDK + Zustand

---

## Phase 1: 核心 MVP（高优先级）

> 产出：能显示 Live2D 角色 + 对话 + 短期记忆的桌面桌宠

### Task 1: 项目脚手架

**Files:** `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `electron-builder.yml`, `index.html`, `tailwind.config.js`, `postcss.config.js`

### Task 2: Electron 主进程 + 窗口 + 托盘

**Files:** `electron/main.ts`, `electron/preload.ts`, `electron/tray.ts`, `shared/types.ts`

### Task 3: Agent Core 骨架

**Files:** `agent/index.ts`, `agent/bus.ts`, `agent/queue.ts`

### Task 4: LLM 客户端

**Files:** `agent/llm/types.ts`, `agent/llm/providers.ts`, `agent/llm/client.ts`, `agent-config.json`

### Task 5: 短期记忆

**Files:** `agent/memory/short-term.ts`

### Task 6: 对话管理器

**Files:** `agent/conversation/manager.ts`

### Task 7: React UI

**Files:** `renderer/main.tsx`, `renderer/App.tsx`, `renderer/index.css`, `renderer/ui/DesktopPet.tsx`, `renderer/ui/ChatPanel.tsx`, `renderer/store/state.ts`

### Task 8: Live2D 渲染引擎

**Files:** `renderer/pet/engine.ts`

### Task 9: IPC 连通

**Modify:** `electron/main.ts` (添加 agent IPC handlers)

---

## Phase 2: 智能增强（后续展开）

- 长期记忆（SQLite + 过期机制 + 检索）
- 用户画像（多维度自动收集）
- 工具系统（Tool接口 + 内置工具 + Function Calling）
- 任务调度（cron + 任务队列）
- 长任务 Hook（生命周期状态机 + 进度跟踪）
- 任务面板 UI + 设置面板

## Phase 3: 生态扩展（后续展开）

- Skill 编排系统（Skill接口 + 执行引擎）
- 监控系统（进程/窗口/文件监控 + 规则引擎）
- 语音交互（唤醒词 + TTS/STT）
- 动画完善 + 扩展管理 UI
