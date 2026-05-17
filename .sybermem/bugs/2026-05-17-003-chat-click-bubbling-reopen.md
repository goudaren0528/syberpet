---
type: bug
date: 2026-05-17
number: 003
title: ChatPanel 关闭按钮点击冒泡导致聊天面板立即重新打开
severity: high
---

## Bug Description
点击 ChatPanel 的 ✕ 关闭按钮后，聊天面板关闭约 200ms 后立即重新打开，用户无法正常关闭对话框。

## Root Cause
事件冒泡链：
1. ChatPanel 的 `<button onClick={toggleChat}>✕</button>` 触发 → `toggleChat()` → `chatVisible = false`（聊天关闭）
2. click 事件冒泡到 App 外层 `<div onClick={onClick}>`
3. App 的 `onClick` 检查 `didDrag` 为 false（不是拖动）→ 执行 `bounce()` + `setTimeout(() => toggleChat(), 200)`
4. 200ms 后 `toggleChat()` 再次触发 → `chatVisible = true`（聊天重新打开）

同样的问题也影响 ChatPanel 内部所有的 mousedown 事件，会触发 App 层的拖动逻辑。

## Solution
在 ChatPanel 容器 div 上添加 `onClick={e => e.stopPropagation()}` 和 `onMouseDown={e => e.stopPropagation()}`，阻止所有来自聊天面板的点击和拖动事件冒泡到 App 层。

```tsx
<div style={s.panel} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
```

## Prevention Measures
- 浮层/弹窗组件应始终阻止事件冒泡到父层交互区域
- 当父级有全局手势处理（拖动、点击）时，子组件需要明确的事件隔离

## Related Changes
- `renderer/ui/ChatPanel.tsx:98` — 添加 stopPropagation
