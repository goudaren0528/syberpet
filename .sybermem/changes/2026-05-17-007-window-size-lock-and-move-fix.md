---
type: change
date: 2026-05-17
number: 007
title: 窗口大小锁定方案重构 — 从运行时纠正改为原生约束
status: implemented
author: AI
related_files: electron/main.ts
---

## Change Content
重构窗口大小防护策略，解决 Windows 无边框透明窗口拖动时持续变大的问题。

### 核心变更
1. **WIN_W/WIN_H 提升到模块作用域** — 原先 `winW`/`winH` 是 `createWindow()` 内的局部变量，IPC handler 无法访问，导致 `setSize(undefined, undefined)` 完全无效
2. **添加 minWidth/maxWidth/minHeight/maxHeight** — 从 Win32 原生层面锁死窗口大小，即使 DPI/DWM 尝试调整也无法突破约束
3. **移除 will-resize 拦截** — 该方案可能阻止窗口初始化时的尺寸设定，导致窗口 0 尺寸（宠物不可见）
4. **简化 move handler** — 回归简单 `setPosition()`，不再做运行时大小纠正，依赖 min/max 约束

### 方案演进历程
| 尝试 | 方案 | 结果 |
|------|------|------|
| 1 | `resizable: false` | 无效，Windows DWM 仍然添加隐形边框 |
| 2 | + `thickFrame: false` + `hasShadow: false` | 无效 |
| 3 | `setPosition` + `setSize` 纠正 | 无效——`winW`/`winH` 作用域错误，值为 undefined |
| 4 | 修复作用域 + `setBounds` 原子操作 | 引起闪烁 |
| 5 | 修复作用域 + `will-resize` 拦截 | 阻止初始化，宠物不可见 |
| 6 | **`minWidth/maxWidth/minHeight/maxHeight` 原生约束** | 当前方案 |

## Reason for Change
Windows 11 DPI 缩放环境下，Electron 无边框透明窗口调用 `setPosition()` 会触发 DWM 隐式改变窗口大小。之前的修复尝试都在应用层纠正（runtime correction），但各有缺陷。原生 min/max 约束是 Win32 层面的硬限制，最为可靠。

## Impact Scope
- `electron/main.ts` — BrowserWindow 选项、IPC handler
- 不影响渲染层、引擎或状态管理
