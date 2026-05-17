---
type: bug
date: 2026-05-17
number: 002
title: 无边框透明窗口拖动时持续变大 + 拖动与点击手势冲突
severity: high
---

## Bug Description
两个相关的交互 bug：
1. **窗口拖动变大**：在 Windows 上拖动宠物窗口时，窗口尺寸会持续增大，最终占满整个屏幕
2. **拖动与点击冲突**：每次拖动松手后都会触发 `onClick`→`toggleChat()`，导致聊天面板意外打开/关闭

## Root Cause

### Bug 1: 窗口变大
`electron/main.ts:32` 设置 `resizable: true`。在 Windows 平台上，Electron 无边框透明窗口设为可调整大小时，系统会添加 `WS_THICKFRAME` 窗口样式（不可见的拖拽边框）。这些隐形边框与自定义拖动逻辑产生冲突，导致每次 `setPosition()` 调用时窗口尺寸累积增长。

这是 Electron 的已知问题，参见 electron/electron#33495、#49173。

### Bug 2: 手势冲突
`renderer/App.tsx` 中 `onMouseDown`/`onMouseUp`/`onClick` 共用同一个 div，没有区分拖动手势和点击手势。鼠标按下→移动→松手的拖动操作也会触发 `onClick` 事件，因为 DOM 的 click 事件不区分是否发生了移动。

## Solution

### Bug 1
将 `resizable: true` 改为 `resizable: false`。桌面宠物窗口不需要用户手动调整大小。

### Bug 2
在 `dragRef` 中添加 `didDrag` 标志和 5px 移动阈值：
- `onMouseDown`: 初始化 `didDrag = false`
- `onMouseMove`: 移动超过 5px 时设置 `didDrag = true`，才开始调用 `moveWindow`
- `onClick`: 检查 `didDrag`，如果为 true 则跳过 `bounce()` 和 `toggleChat()`

## Prevention Measures
- Electron 无边框透明窗口在 Windows 上应始终设 `resizable: false`，除非有明确的调整大小需求
- 自定义拖动逻辑必须与点击事件区分，使用移动阈值判定

## Related Changes
- `electron/main.ts:32` — `resizable: false`
- `renderer/App.tsx:54-83` — 拖动阈值 + didDrag 标志
