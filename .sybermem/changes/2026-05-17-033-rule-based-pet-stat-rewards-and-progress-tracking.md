---
type: change
date: 2026-05-17
number: 033
title: 规则型属性增长接入，并补充进度跟踪
status: implemented
author: AI
related_files: renderer/pet/interactionRewards.ts, renderer/store/state.ts, renderer/ui/InputBar.tsx, todo.md, .sybermem/INDEX.md
---

## Change Content

为 SyberPet 接入了第一版**规则型属性增长**，并补充了一个项目级 `todo.md` 用来记录当前体验骨架任务进展，以及关联的 design / plan 文件。

### 核心变更
1. **新增本地规则判定层**
   - 新增 `renderer/pet/interactionRewards.ts`
   - 将互动文本分为：
     - 普通聊天 → `mood`
     - 喂食类表达 → `hunger + 少量 mood`
     - 休息/鼓励/完成任务类表达 → `energy + 少量 mood`

2. **把奖励应用入口收敛到 store**
   - `renderer/store/state.ts` 新增 `applyInteractionReward()`
   - 在 store 内统一处理 `hunger / mood / energy` 的累加、`0-100` clamp、以及 `lastUpdatedAt` 更新时间
   - 同时清除了此前误写入 `state.ts` 的工具元文本污染，恢复语法与状态逻辑完整性

3. **在主输入路径接入奖励**
   - `renderer/ui/InputBar.tsx` 在用户发送消息后调用：
     - `detectInteractionReward(content)`
     - `applyInteractionReward(...)`
   - 保持原有对话阶段节奏不变，不把奖励逻辑散落到 UI 其他位置

4. **补充进度跟踪文件**
   - 新增根目录 `todo.md`
   - 记录当前体验骨架已完成/进行中/待完成事项
   - 链接本轮相关设计与计划文件，方便后续继续推进

## Reason for Change

体验骨架设计明确要求先建立一个可解释、轻量、不过度依赖 LLM 的养成反馈闭环，让普通聊天和特定互动都能推动宠物状态变化。同时，当前任务已跨越多个阶段，需要一个清晰的本地进度文件帮助后续继续按设计和计划推进。

## Impact Scope
- `renderer/pet/interactionRewards.ts` — 第一版本地互动奖励判定
- `renderer/store/state.ts` — 奖励应用入口、needs 更新、污染修复
- `renderer/ui/InputBar.tsx` — 主发送路径接入奖励判定与应用
- `todo.md` — 记录体验骨架进展与关联设计/计划文件
- `.sybermem/INDEX.md` — 新增变更记录与关键结论

## Verification
- `npx tsx ./.claude/interaction-reward-rules.test.ts`
- `npx tsx ./.claude/interaction-reward-store.test.ts`
- `npx tsx ./.claude/interaction-reward-integration.test.ts`
- `npx tsc --noEmit`
- `npm run build`

## Notes
- 当前主交互发送路径已经走 `InputBar`，因此奖励接入已覆盖主流程。
- `ChatPanel.tsx` 仍保留旧发送路径，但当前不再是主界面入口；若后续重新启用，需要同步对齐奖励逻辑。
