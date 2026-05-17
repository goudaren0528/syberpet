---
type: bug
date: 2026-05-17
number: 004
title: 透明无边框窗口拖动时坐标漂移与跟手不稳
severity: high
---

## Bug Description
在 Windows 上拖动透明无边框桌宠窗口时，渲染层基于 `clientX` / `clientY` 计算拖动增量，而窗口本身会同步移动，导致鼠标相对视口坐标持续变化，出现拖动漂移、跟手不稳的问题。

## Root Cause
`renderer/App.tsx` 使用 `e.clientX - prevClientX` / `e.clientY - prevClientY` 作为窗口移动增量。由于 `clientX` / `clientY` 是相对于当前窗口视口的坐标，而 frameless Electron 窗口在拖动过程中会不断改变屏幕位置，连续 move 事件之间的坐标基准也会跟着改变，导致增量不稳定。

同时，拖动逻辑回退成了仅用 `dragging` 标志的实现，丢失了此前用于区分点击与拖动的 `didDrag` + 5px 阈值语义，容易让拖动松手后的 click 手势重新触发聊天切换。

## Solution
在 `renderer/App.tsx` 中将拖动增量改为基于 `screenX` / `screenY` 计算，并恢复 5px 阈值与 `didDrag` 语义：
- `onMouseDown` 记录 `startScreenX/startScreenY` 与 `lastScreenX/lastScreenY`
- `onMouseMove` 先根据总位移判断是否超过 5px 阈值，再仅在 `didDrag = true` 后调用 `moveWindow`
- `onClick` 遇到 `didDrag = true` 时直接消费本次点击，避免拖动后误开关聊天
- 保留全局 `window.mouseup` 兜底，不依赖 `mouseleave`

主进程 `electron/main.ts` 的 `window:move` IPC 已经采用 `getPosition()` + `setPosition()` 的 position-only 更新方式，因此本次无需新增 IPC 或修改 preload 类型桥接。

## Prevention Measures
- 对会随窗口位置变化的拖动场景，优先使用 `screenX` / `screenY`，避免把视口坐标当作稳定参考系
- 自定义拖动手势必须保留阈值判定与 click suppression，防止拖动和点击语义互相污染
- 透明无边框窗口移动逻辑应只更新 position，避免不必要的 bounds 级操作造成闪烁

## Related Changes
- `D:\syberpet\.claude\worktrees\agent-a0488c9d\renderer\App.tsx:6-25` — 恢复 drag 状态结构与 5px 阈值常量
- `D:\syberpet\.claude\worktrees\agent-a0488c9d\renderer\App.tsx:63-123` — 改为基于 screen 坐标拖动，恢复 didDrag click suppression，并保留全局 mouseup 兜底
- `D:\syberpet\.claude\worktrees\agent-a0488c9d\electron\main.ts:102-107` — 确认主进程已使用 `getPosition()` + `setPosition()`
