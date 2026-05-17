---
type: change
date: 2026-05-17
number: 029
title: 右键只读历史面板接入，并让气泡回复同步进入记录
status: implemented
author: AI
related_files: renderer/App.tsx, renderer/store/state.ts, renderer/ui/HistoryPanel.tsx, .sybermem/INDEX.md
---

## Change Content
为 SyberPet 接入了一个从右键菜单打开的**只读对话记录面板**，并让宠物通过气泡展示的 AI 回复同时写入历史记录，保证“主交互仍然轻量、但最近对话可回看”。

### 核心变更
1. **新增只读历史面板**
   - 新增 `renderer/ui/HistoryPanel.tsx`。
   - 面板展示最近的用户消息与 SyberPet 回复。
   - 历史面板不承担输入职责，只做回看。
   - 流式回复过程中也可显示当前正在生成的内容预览。

2. **右键菜单接入“对话记录”入口**
   - `renderer/App.tsx` 的右键菜单移除无效占位项，改为保留“对话记录 / 设置 / 退出”。
   - 点击“对话记录”会打开只读历史面板。
   - 点击菜单外部可关闭菜单，`Esc` 可关闭历史面板。

3. **历史与气泡回复同步**
   - `renderer/store/state.ts` 的 `commitStreamToBubble()` 现在会在提交气泡前，把 AI 最终回复同步追加到 `messages`。
   - 这样主交互仍然通过宠物气泡表达，但历史面板可以准确回看双方最近对话。

4. **设置与历史视图切换整理**
   - 历史面板显示时不再混入设置态。
   - 若历史关闭但设置仍打开，会自动收束回主交互，避免状态交叉导致界面混乱。

## Reason for Change
用户要求保留当前“桌宠 + 底部输入条 + 气泡回复”的轻交互形态，不恢复常驻重聊天面板，但需要一个能从右键菜单进入的地方查看最近对话。因此本次实现选择了只读回看面板，而不是重新引入完整聊天窗口。

## Impact Scope
- `renderer/ui/HistoryPanel.tsx` — 新增只读历史回看面板
- `renderer/App.tsx` — 右键菜单改造、历史面板显示与关闭逻辑、键盘/外部点击收束逻辑
- `renderer/store/state.ts` — `commitStreamToBubble()` 同步将 AI 最终回复写入历史消息列表
- `.sybermem/INDEX.md` — 新增变更记录与关键结论

## Verification
- `npm run build`
- 构建通过；`tsc && vite build` 成功生成 renderer、main 与 preload 三个产物
- 输出仅包含现有 Vite CJS Node API deprecation 提示，无新增类型或构建错误
