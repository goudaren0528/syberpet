---
type: decision
date: 2026-05-18
number: 002
title: 猜拳 skeleton 采用本地轻量流程，并复用右键菜单、InputBar 与气泡反馈
status: decided
author: AI
related_files: docs/superpowers/specs/2026-05-18-rps-mini-game-skeleton-design.md, todo.md, .sybermem/INDEX.md
---

## Context
SyberPet 的体验骨架需求已经明确包含一个“聊天式互动玩法样板”，并限定第一版采用猜拳。当前项目已经有稳定的轻量交互骨架：右键菜单作为次级入口、`InputBar` 作为主输入路径、宠物气泡作为主要反馈形式，同时不希望回退成重聊天面板，也不希望把第一版玩法判定交给 LLM。

在实现前，需要明确猜拳应该如何嵌入现有交互结构，避免把玩法逻辑硬塞进 UI，或为一个 skeleton 过度设计独立子系统。

## Options Considered

### Option 1: 主要逻辑塞进 `InputBar.tsx`
优点：改动快，文件少。
缺点：会让 `InputBar` 继续变重，不利于后续扩展更多轻玩法，也不利于测试。

### Option 2: store 持有轻量玩法状态，纯规则放到单独文件
优点：与现有 interaction rewards 的思路一致；职责更清晰；测试边界更自然；后续扩展更多轻玩法时更稳。
缺点：比直接塞 UI 多一点接线成本。

### Option 3: 为猜拳建立完整 controller / 独立子系统
优点：边界最完整，可扩展性最好。
缺点：对当前 skeleton 明显过重，容易超范围。

## Decision
采用 **Option 2**。

猜拳第一版固定为：
- 通过 `renderer/App.tsx` 的右键菜单进入
- 通过 `renderer/store/state.ts` 保存“是否处于猜拳等待态”这一最小玩法状态
- 通过单独的纯逻辑文件处理输入归一化、随机出拳、胜负判断与奖励计算
- 通过 `renderer/ui/InputBar.tsx` 在主发送路径中分流猜拳输入
- 通过现有宠物气泡反馈结果

同时确认以下范围边界：
- 输入条 placeholder 在玩法态明确切换为 `请输入石头 / 剪刀 / 布`
- 输入兼容中文标准词、常见别名与英文 `rock/paper/scissors`
- 完成一局奖励 `mood +3`，用户赢额外 `energy +2`
- 不做多回合、排行榜、复杂面板或 LLM 判定

## Consequences

### Positive
- 能保持当前“桌宠 + 输入条 + 气泡”的轻交互风格不变
- 玩法状态与判定逻辑边界清晰，不会把复杂判断继续堆进 UI
- 规则层可以先用 TDD 覆盖，再做最小接线实现
- 后续若再加别的超轻玩法，可以沿用同一模式扩展

### Trade-offs
- 第一版玩法状态只够支撑一轮猜拳，不适合直接承载复杂玩法
- 为避免误判普通聊天，输入归一化不会做无限宽松匹配
- 结果仍主要依赖气泡反馈，不提供专门玩法历史或视觉面板

## Follow-up Artifacts
- Design spec: `docs/superpowers/specs/2026-05-18-rps-mini-game-skeleton-design.md`
- Progress tracker: `todo.md`
