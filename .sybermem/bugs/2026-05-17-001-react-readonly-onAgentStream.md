---
type: bug
date: 2026-05-17
number: 001
title: App.tsx 中对 contextBridge API 进行只读属性赋值导致运行时崩溃
severity: high
---

## Bug Description
启动应用后 React 抛出 `TypeError: Cannot assign to read only property 'onAgentStream' of object '#<Object>'`，发生在 `App.tsx:95:11`，导致应用无法正常运行。

## Root Cause
`electron/preload.ts` 通过 `contextBridge.exposeInMainWorld('electronAPI', {...})` 暴露 API，该方式会将 API 对象的所有属性冻结为只读。`App.tsx` 中 streaming chunks 监听逻辑错误地将 `onAgentStream` / `onAgentStreamEnd` 当作可赋值的属性使用（尝试保存原函数引用后覆写），而实际它们是接收回调的函数：

```ts
// 错误用法 - 试图赋值只读属性
const origStream = api.onAgentStream
api.onAgentStream = (chunk) => { ... origStream(chunk) }
```

正确用法在 `ChatPanel.tsx:93-94` 已有先例——作为函数调用传入回调：

```ts
// 正确用法 - 调用函数注册回调
api.onAgentStream((chunk) => appendStream(chunk))
```

## Solution
将 `App.tsx:90-107` 的 streaming 监听逻辑改为函数调用模式，移除对 `onAgentStream` / `onAgentStreamEnd` 的赋值操作，直接调用注册回调：

```ts
api?.onAgentStream?.((chunk) => {
  engineRef.current?.updateStreaming(chunk)
})
api?.onAgentStreamEnd?.(() => {
  engineRef.current?.endStreaming()
})
```

由于 `ipcRenderer.on` 支持同一事件注册多个监听器，App 和 ChatPanel 的流式回调会同时生效，不影响功能。

## Prevention Measures
- `contextBridge.exposeInMainWorld` 暴露的所有属性均为只读，调用方只能使用其暴露的函数签名，不能覆写
- 注册 IPC 事件监听时应始终以函数调用形式使用 API，而非属性赋值

## Related Changes
- 上一提交 `86c9c17` feat: pet interactivity - 本次问题代码随该功能引入
- `renderer/ui/ChatPanel.tsx:93-94` - 正确的 `onAgentStream` 使用方式
