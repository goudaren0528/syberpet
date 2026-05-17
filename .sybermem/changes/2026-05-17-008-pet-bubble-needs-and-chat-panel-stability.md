---
type: change
date: 2026-05-17
number: 008
title: 桌宠气泡与成长系统接入，并稳定聊天面板交互
status: implemented
author: AI
related_files: renderer/App.tsx, renderer/store/state.ts, renderer/ui/ChatPanel.tsx, renderer/ui/SpeechBubble.tsx, renderer/ui/PetNeedsHUD.tsx, renderer/pet/phrases.ts, electron/main.ts, electron/preload.ts, renderer/vite-env.d.ts
---

## Change Content
为桌宠补上轻量自言自语气泡、基础成长属性与本地持久化，并先从渲染层稳定拖动期间的聊天面板表现。

### 核心变更
1. **固定 ChatPanel 高度**
   - 将聊天面板从 `top + bottom` 拉伸布局改为固定高度布局，避免窗口拖动时视觉上持续“变长”。
   - 保留消息区滚动，让内容而不是面板高度变化。

2. **收紧点击 / 拖动判定**
   - 在 `renderer/App.tsx` 中把按下、移动、释放状态拆开处理。
   - 只有“按下后未发生拖动且在宠物区域内释放”时才触发打开聊天，降低长按和拖动误触。
   - 增加 `mouseup` 全局清理与 `mouseleave` 兜底，避免拖动状态残留。

3. **新增桌宠气泡系统**
   - 在 Zustand store 中增加 `petBubble`、`showPetBubble()`、`clearPetBubble()`。
   - 新增 `renderer/ui/SpeechBubble.tsx`，提供玻璃态气泡和淡入上浮动画。
   - 新增 `renderer/pet/phrases.ts`，按卖萌、时段问候、饥饿、低精力、心情等类别组织预设语料。
   - 在 `renderer/App.tsx` 中增加随机自语调度：聊天开启、正在 streaming、或已有气泡时不打断；有 API Key 时低概率使用 AI 文案。

4. **新增基础成长系统与本地持久化**
   - 在 store 中新增 `petNeeds`（饱食度 / 心情 / 精力）及 `hydratePetNeeds()`、`tickPetNeeds()`、`improveMood()` 等方法。
   - 新增 `renderer/ui/PetNeedsHUD.tsx`，显示三项低存在感状态条。
   - 在主进程增加 `pet:load-state` / `pet:save-state` IPC，将数据保存到 `app.getPath('userData')/pet-data.json`。
   - 启动时加载、运行中节流保存，并用低精力 → sleeping、低饱食 / 低精力 → need 气泡完成最小反馈闭环。

5. **增加 AI 气泡生成通道**
   - 在 `electron/main.ts` 中新增 `pet:generate-bubble`。
   - 复用现有 LLM 配置，但单独通过轻量 prompt 生成一句短气泡，不写入正式对话历史。

## Reason for Change
用户当前更在意的是“拖动时聊天框一直变长”的体验问题，以及桌宠缺少主动表达和长期状态。相比继续深挖底层窗口漂移，先把聊天面板改成固定高度能更快稳定核心交互；同时补上气泡与成长系统，形成桌宠最小可用的陪伴闭环。

## Impact Scope
- `renderer/App.tsx` — 拖动/点击拆分、随机自语调度、成长 tick、加载与保存
- `renderer/store/state.ts` — 气泡状态、成长状态与行为方法
- `renderer/ui/ChatPanel.tsx` — 固定高度布局
- `renderer/ui/SpeechBubble.tsx` — 新增桌宠气泡组件
- `renderer/ui/PetNeedsHUD.tsx` — 新增成长 HUD
- `renderer/pet/phrases.ts` — 新增预设语料
- `electron/main.ts` — AI 气泡生成、本地 pet state 持久化 IPC
- `electron/preload.ts`, `renderer/vite-env.d.ts` — 补充桥接接口类型

## Verification
- `npx tsc --noEmit`
- `npm run build`
- 构建通过；Vite 输出仅包含现有 CJS Node API deprecation 提示，无新增类型或构建错误
