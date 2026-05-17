---
type: bug
date: 2026-05-17
number: 005
title: 透明无边框窗口拖动时窗口尺寸在移动过程中持续膨胀
severity: high
---

## Bug Description
Windows 下拖动透明无边框 Electron 桌宠窗口时，底部输入条和右上角调试文字会一起变大。继续排查后发现，不是单个 renderer 组件缩放，而是整个 BrowserWindow 在拖动过程中真实发生了尺寸增长。

## Root Cause
`renderer/App.tsx` 已经改为基于 `screenX` / `screenY` 的拖动增量，主进程 `electron/main.ts` 也只调用 `setPosition(...)`。但在 Windows 透明无边框窗口场景下，单纯 position move 过程中仍会触发原生层 resize 漂移，导致：
- `mainWindow.getBounds()` / `getContentBounds()` 持续增长
- renderer 的 `window.innerWidth/innerHeight` 和 `outerWidth/outerHeight` 同步增长
- 输入条、角标、气泡等所有 DOM 叠层看起来一起“变大”

诊断日志证据表明：初始窗口约为 `400x500` 内容区，拖动过程中持续增长到更大尺寸，因此问题属于窗口层而非 UI 样式层。

## Solution
在 `electron/main.ts` 中增加最小化内容尺寸锁定：
- 新增 `ensureWindowContentSize(win)`，以 `getContentSize()` 为准检测内容区是否偏离 `400x500`
- 创建窗口后立即调用 `setContentSize(WIN_W, WIN_H)`
- 在 `did-finish-load`、`resize`、`move` 后调用 `ensureWindowContentSize(...)`
- `window:set-size` IPC 改为 `setContentSize(...)`，统一以内容区尺寸为准
- 清理本轮诊断日志，恢复 renderer 正常拖动逻辑

这保持了 position-only 拖动路径，同时在发生原生尺寸漂移时做最小纠正，避免回退到高闪烁的 `setBounds(...)` 方案。

## Prevention Measures
- 透明无边框窗口固定尺寸时，优先锁定 content size，而不是仅依赖 outer bounds
- 遇到“组件一起变大/缩小”的现象，优先检查窗口真实 bounds 与 viewport，而不是先怀疑单个组件 CSS
- 对 Windows 特有的无边框透明窗口问题，保留最小化原生层纠偏比在 renderer 层打补丁更可靠

## Related Changes
- `electron/main.ts` — 增加 `ensureWindowContentSize(...)`，在 move/resize/load 后纠正内容区尺寸漂移
- `renderer/App.tsx` — 移除本轮拖动诊断日志，保留基于 `screenX/screenY` 的稳定拖动逻辑
- `scripts/drag_window_diag.py` / `scripts/drag_window_verify.py` — 用于本次问题的复现与修复后回归验证
