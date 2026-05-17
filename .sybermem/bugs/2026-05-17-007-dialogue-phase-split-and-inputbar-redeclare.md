---
type: bug
date: 2026-05-17
number: 007
title: 对话阶段拆分后 InputBar 重复声明与 talking 过早切换
severity: medium
---

## Bug Description
在实现“发送后先 thinking、收到首个 chunk 再 talking”的对话节奏时，`npm run build` 失败，报错指向 `renderer/ui/InputBar.tsx` 中重复声明 `stop`。同时，界面状态流里还残留了一段会在 `streaming=true` 时直接进入 `streaming` 阶段的逻辑，导致宠物可能在真正收到首个回复 chunk 之前就过早进入 talking。

## Root Cause
本次重构把新的对话阶段逻辑接入到了 `InputBar` 和 `App`，但旧实现没有完全清理：

- `renderer/ui/InputBar.tsx` 中残留了两个同名的 `const stop` 回调，触发 TypeScript 的块级变量重复声明错误
- `renderer/ui/InputBar.tsx` 还保留了一个基于 `streaming` 布尔值直接设置 `dialoguePhase='streaming'` 的 effect，这与“只有首个 chunk 到达才切到 streaming/talking”的需求冲突
- `renderer/App.tsx` 中仍保留旧的 `streaming -> talking` 冗余 effect，与新的 `dialoguePhase -> petState` 映射并存，形成双重状态来源

问题本质不是单一语法错误，而是对话阶段模型从 `streaming` 布尔值迁移到 `dialoguePhase` 枚举时，旧状态驱动路径未完全移除。

## Solution
围绕“`dialoguePhase` 作为唯一对话节奏来源”做最小清理：

- 删除 `renderer/ui/InputBar.tsx` 中重复的 `stop` 声明，恢复编译通过
- 删除 `InputBar` 里基于 `streaming` 直接推进 `dialoguePhase='streaming'` 的残留 effect
- 保留 `renderer/store/state.ts` 中 `appendStream()` 作为进入 `streaming` 的唯一入口，这样只有首个实际 chunk 到达时才切换到 talking
- 删除 `renderer/App.tsx` 中旧的 `streaming -> talking` 冗余 effect，只保留 `dialoguePhase -> petState` 映射

## Prevention Measures
- 当状态模型从布尔值迁移为阶段枚举时，必须同步删除旧的派生逻辑，避免同一行为被两套 effect 驱动
- 对 UI 行为重构，先用最小编译检查（如 `npx tsc --noEmit`）锁定语法/声明层回归，再做完整构建验证
- 类似 `talking` 这种表现态应有单一真相来源，避免 `store`、组件 effect、渲染引擎各自推状态

## Related Changes
- `renderer/store/state.ts` — 引入 `DialoguePhase` 并让 `appendStream()` 成为进入 `streaming` 的唯一入口
- `renderer/ui/InputBar.tsx` — 删除重复 `stop` 声明与过早切换 `streaming` 的残留 effect
- `renderer/App.tsx` — 删除旧的 `streaming -> talking` 冗余 effect，只保留 `dialoguePhase -> petState` 映射
- `.sybermem/INDEX.md` — 新增 bug 记录与关键结论
