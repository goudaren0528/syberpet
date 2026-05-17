---
type: bug
date: 2026-05-17
number: 006
title: InputBar 切换设置时复用 input 节点触发受控状态警告
severity: medium
---

## Bug Description
点击底部 `InputBar` 的“设置”后，React 在控制台报出警告：

`Warning: A component is changing an uncontrolled input to be controlled.`

报错栈指向 `renderer/ui/InputBar.tsx`。问题发生在聊天输入条与设置输入条之间切换时。

## Root Cause
`renderer/ui/InputBar.tsx` 在两种 UI 模式下都返回了结构相近的根节点，并且第一个表单元素都是 `<input>`：
- 聊天模式下，第一个 `<input>` 是消息输入框，未传 `value`，属于非受控 input
- 设置模式下，第一个 `<input>` 是 API Key 输入框，传入了 `value={apiKeyInput}`，属于受控 input

React 在模式切换时复用了同一个 DOM input 节点，于是把同一节点从“非受控”切到了“受控”，触发 warning。

问题不在 `getConfigStatus()` 返回了 `undefined`，而在于不同语义的 input 被 React 误当成同一节点复用。

## Solution
对 `InputBar` 的两种模式根节点显式加 key，强制 React 在模式切换时分别 remount：
- 聊天模式根节点加 `key="chat"`
- 设置模式根节点加 `key="settings"`

这样聊天输入框和设置输入框不再共享同一个底层 DOM 节点，受控/非受控状态也不会跨模式串联。

## Prevention Measures
- 条件渲染的两种表单模式如果结构相似但语义不同，应避免让 React 复用同一个 input 节点
- 遇到 uncontrolled/controlled warning 时，除了检查 state 初值，也要检查条件分支之间的 DOM 复用
- 对“聊天输入框”和“配置输入框”这类职责完全不同的表单区域，优先使用稳定 key 或拆分组件边界

## Related Changes
- `renderer/ui/InputBar.tsx` — 为聊天态和设置态根节点分别添加 `key="chat"` / `key="settings"`
- `.sybermem/INDEX.md` — 新增 bug 记录与关键结论
