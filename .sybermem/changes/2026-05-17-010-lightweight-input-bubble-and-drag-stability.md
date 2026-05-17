---
type: change
date: 2026-05-17
number: 010
title: 轻量输入条、宠物气泡回复与拖动稳定性重构
status: implemented
author: AI
related_files: renderer/App.tsx, renderer/store/state.ts, renderer/ui/InputBar.tsx, renderer/ui/SpeechBubble.tsx, renderer/ui/PetNeedsHUD.tsx, electron/main.ts, electron/preload.ts, renderer/vite-env.d.ts
---

## Change Content
将当前“右侧聊天面板 + 桌宠”交互重构为更轻量的桌面宠物模式：底部常驻输入、宠物气泡回复、稳定拖动，以及更薄的头顶状态带。

### 核心变更
1. **主聊天入口改为底部 InputBar**
   - 新增 `renderer/ui/InputBar.tsx`，提供底部常驻玻璃态横条输入框。
   - 支持 Enter 和发送按钮发消息，并保留设置入口。
   - 输入条内部显式 `stopPropagation()`，避免触发外层拖动和点击逻辑。
   - `renderer/App.tsx` 不再渲染 `ChatPanel` 作为主界面入口，宠物点击只保留轻互动反馈，不再弹出右侧聊天框。

2. **assistant 回复统一进入宠物气泡**
   - 在 `renderer/store/state.ts` 中新增 `commitStreamToBubble()`，将流式结果直接提交到 `petBubble`，而不是对话面板消息列表。
   - `InputBar` 负责累计 stream 文本，stream end 时提交气泡；`App` 继续用 stream 事件驱动 talking 动画。
   - `renderer/ui/SpeechBubble.tsx` 调整为更接近宠物头部的居中定位，并为 AI 回复提供更宽展示区域。
   - `renderer/App.tsx` 为 AI 气泡增加更长显示时长，按文本长度附加阅读时间。

3. **拖动恢复为稳定的屏幕坐标模型**
   - `renderer/App.tsx` 将窗口拖动从 `clientX/clientY` 增量改为 `screenX/screenY` 增量。
   - 保留 5px 阈值与 `didDrag` 语义，避免拖动后误触点击。
   - `electron/main.ts` 将窗口移动更新为 `getPosition()` + `setPosition(...)`，避免每帧 `setBounds(...)` 带来的透明窗口闪烁。

4. **属性 HUD 进一步弱化**
   - `renderer/ui/PetNeedsHUD.tsx` 收紧 padding、字号、gap 和阴影。
   - 将属性条位置下移到更靠近宠物头顶，保持 `图标 + 数值` 的极薄胶囊带形态。

5. **修复 stream 监听生命周期**
   - `electron/preload.ts` 的 stream / context-menu 订阅接口改为返回取消订阅函数。
   - `renderer/App.tsx` 与 `renderer/ui/InputBar.tsx` 在 effect cleanup 中注销监听，避免热重载或重挂载后重复监听造成的重复追加与重复提交。

## Reason for Change
用户希望当前交互更像桌面宠物而不是侧边聊天应用：输入要常驻但低存在感，回复要贴着宠物显示，拖动要恢复稳定跟手，同时 HUD 需要进一步隐身化。此次改动集中在交互形态重构与已知拖动根因修复，而不是新增对话或成长能力。

## Impact Scope
- `renderer/App.tsx` — 主界面入口切换、拖动修复、气泡时长调整、stream talking 动画监听
- `renderer/store/state.ts` — 新增 `commitStreamToBubble()`
- `renderer/ui/InputBar.tsx` — 新增底部输入条与设置入口
- `renderer/ui/SpeechBubble.tsx` — 头顶定位与 AI 气泡展示优化
- `renderer/ui/PetNeedsHUD.tsx` — 更薄的头顶状态带
- `electron/main.ts` — 窗口移动改为 position-only 更新
- `electron/preload.ts`, `renderer/vite-env.d.ts` — IPC 监听取消订阅接口

## Verification
- `npm run build`
- 构建通过；`tsc && vite build` 成功生成 renderer、main 与 preload 三个产物
- 输出仅包含现有 Vite CJS Node API deprecation 提示，无新增类型或构建错误
