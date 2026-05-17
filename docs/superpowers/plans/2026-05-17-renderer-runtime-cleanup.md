# Renderer Runtime Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize renderer runtime behavior by making the Electron preload event bridge disposable, cleaning up renderer subscriptions, and tightening typed `electronAPI` usage without changing user-facing behavior.

**Architecture:** Keep the existing Electron main/preload and React renderer structure, but correct the bridge contract at the preload boundary so listener registration returns unsubscribe functions. Then update the renderer typing and subscribing components to use that contract consistently, while keeping chat stream ownership in `ChatPanel` and pet animation reactions in `App`.

**Tech Stack:** Electron 28, React 18, TypeScript 5, Vite 5, Zustand 4

---

## File Map

- Modify: `electron/preload.ts`
  - Responsibility: expose safe renderer-facing APIs via `contextBridge`, including stream listener subscription/unsubscription
- Modify: `renderer/vite-env.d.ts`
  - Responsibility: declare the actual `window.electronAPI` contract used by the renderer
- Modify: `renderer/App.tsx`
  - Responsibility: subscribe to pet-related stream events, manage cleanup, and use typed bridge access for window movement + stream hooks
- Modify: `renderer/ui/ChatPanel.tsx`
  - Responsibility: subscribe to chat stream events, manage cleanup, and use typed bridge access for config + message send flows
- Verify: `package.json`
  - Responsibility: defines available verification commands (`npm run build`, `npm run dev`)
- Verify: `docs/superpowers/specs/2026-05-17-renderer-runtime-cleanup-design.md`
  - Responsibility: approved design constraints and success criteria

## Task 1: Make preload listener APIs disposable

**Files:**
- Modify: `electron/preload.ts`
- Verify: `renderer/vite-env.d.ts`

- [ ] **Step 1: Write the failing contract check**

Read `electron/preload.ts` and confirm that the current listener APIs only register listeners and return `void`:

```ts
onAgentMessage: (callback: (msg: any) => void) => {
  ipcRenderer.on('agent:message', (_event, msg) => callback(msg))
},
onAgentStream: (callback: (chunk: string) => void) => {
  ipcRenderer.on('agent:stream', (_event, chunk: string) => callback(chunk))
},
onAgentStreamEnd: (callback: () => void) => {
  ipcRenderer.on('agent:stream-end', () => callback())
},
onContextMenu: (callback: (items: any[]) => void) => {
  ipcRenderer.on('context-menu', (_event, items) => callback(items))
},
```

Expected failure condition: there is no way for a React effect to remove the exact listener it added.

- [ ] **Step 2: Verify the current contract is incomplete**

Run: `npm run build`

Expected: PASS, which confirms this is a runtime lifecycle problem rather than a compile-time failure.

- [ ] **Step 3: Write the minimal preload implementation with disposers**

Update `electron/preload.ts` so each listener registration stores a named handler, registers it once, and returns a disposer that removes that exact handler:

```ts
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  moveWindow: (dx: number, dy: number) => ipcRenderer.invoke('window:move', dx, dy),
  setWindowSize: (w: number, h: number) => ipcRenderer.invoke('window:set-size', w, h),

  sendToAgent: (msg: any) => ipcRenderer.invoke('agent:send', msg),
  onAgentMessage: (callback: (msg: any) => void) => {
    const handler = (_event: IpcRendererEvent, msg: any) => callback(msg)
    ipcRenderer.on('agent:message', handler)
    return () => ipcRenderer.removeListener('agent:message', handler)
  },
  onAgentStream: (callback: (chunk: string) => void) => {
    const handler = (_event: IpcRendererEvent, chunk: string) => callback(chunk)
    ipcRenderer.on('agent:stream', handler)
    return () => ipcRenderer.removeListener('agent:stream', handler)
  },
  onAgentStreamEnd: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('agent:stream-end', handler)
    return () => ipcRenderer.removeListener('agent:stream-end', handler)
  },

  onContextMenu: (callback: (items: any[]) => void) => {
    const handler = (_event: IpcRendererEvent, items: any[]) => callback(items)
    ipcRenderer.on('context-menu', handler)
    return () => ipcRenderer.removeListener('context-menu', handler)
  },

  saveConfig: (config: { apiKey: string; provider: string }) =>
    ipcRenderer.invoke('config:save', config),
  getConfigStatus: () => ipcRenderer.invoke('config:status')
})
```

- [ ] **Step 4: Run build to verify the preload contract still compiles**

Run: `npm run build`

Expected: FAIL in renderer typing call sites until `renderer/vite-env.d.ts` and component usage are updated.

- [ ] **Step 5: Commit the preload contract change**

```bash
git add electron/preload.ts
git commit -m "fix: return unsubscribe functions from preload listeners"
```

## Task 2: Align renderer typings with the real bridge contract

**Files:**
- Modify: `renderer/vite-env.d.ts`
- Verify: `electron/preload.ts`

- [ ] **Step 1: Write the failing type expectation**

Read the current `renderer/vite-env.d.ts` and confirm the listener APIs still return `void`:

```ts
interface ElectronAPI {
  moveWindow: (dx: number, dy: number) => Promise<void>
  setWindowSize: (w: number, h: number) => Promise<void>
  sendToAgent: (msg: any) => Promise<any>
  onAgentMessage: (callback: (msg: any) => void) => void
  onAgentStream: (callback: (chunk: string) => void) => void
  onAgentStreamEnd: (callback: () => void) => void
  onContextMenu: (callback: (items: any[]) => void) => void
  saveConfig: (config: { apiKey: string; provider: string; model: string }) => Promise<any>
  getConfigStatus: () => Promise<{ configured: boolean; provider: string; model: string }>
}
```

Expected failure condition: the declared contract no longer matches the intended preload implementation.

- [ ] **Step 2: Run build to confirm the current types still reflect the old shape**

Run: `npm run build`

Expected: either PASS before the preload edit is applied, or FAIL after Task 1 because the plan intentionally changed the implementation contract first.

- [ ] **Step 3: Write the minimal type updates**

Update `renderer/vite-env.d.ts` so event registration returns `() => void` and the config method shape matches current runtime usage:

```ts
/// <reference types="vite/client" />

interface ElectronAPI {
  moveWindow: (dx: number, dy: number) => Promise<void>
  setWindowSize: (w: number, h: number) => Promise<void>
  sendToAgent: (msg: any) => Promise<any>
  onAgentMessage: (callback: (msg: any) => void) => () => void
  onAgentStream: (callback: (chunk: string) => void) => () => void
  onAgentStreamEnd: (callback: () => void) => () => void
  onContextMenu: (callback: (items: any[]) => void) => () => void
  saveConfig: (config: { apiKey: string; provider: string; model: string }) => Promise<any>
  getConfigStatus: () => Promise<{ configured: boolean; provider: string; model: string }>
}

interface Window {
  electronAPI?: ElectronAPI
}
```

- [ ] **Step 4: Run build to verify type alignment**

Run: `npm run build`

Expected: PASS for the type declaration itself, or remaining FAILs only in renderer components that still rely on old usage patterns.

- [ ] **Step 5: Commit the type contract update**

```bash
git add renderer/vite-env.d.ts
git commit -m "fix: align renderer bridge types with preload contract"
```

## Task 3: Clean up `App.tsx` subscriptions and typed bridge access

**Files:**
- Modify: `renderer/App.tsx`
- Verify: `renderer/vite-env.d.ts`

- [ ] **Step 1: Write the failing lifecycle check**

Read `renderer/App.tsx` and confirm the stream effect registers listeners without cleanup and still uses `any` bridge access:

```ts
;(window as any).electronAPI?.moveWindow(e.clientX - d.sx, e.clientY - d.sy)
```

```ts
useEffect(() => {
  const api = (window as any).electronAPI
  api?.onAgentStream?.((chunk: string) => {
    engineRef.current?.updateStreaming(chunk)
  })
  api?.onAgentStreamEnd?.(() => {
    engineRef.current?.endStreaming()
  })
}, [])
```

Expected failure condition: the component has no way to tear down the exact listeners it added.

- [ ] **Step 2: Run build before editing `App.tsx`**

Run: `npm run build`

Expected: PASS or FAIL only because `App.tsx` still does not consume the new disposer contract.

- [ ] **Step 3: Write the minimal `App.tsx` cleanup implementation**

Update the bridge usage and effect cleanup in `renderer/App.tsx`:

```ts
const onMove = useCallback((e: React.MouseEvent) => {
  const d = dragRef.current
  if (d.dragging) {
    window.electronAPI?.moveWindow(e.clientX - d.sx, e.clientY - d.sy)
    d.sx = e.clientX
    d.sy = e.clientY
  }
  if (winRef.current) {
    const rect = winRef.current.getBoundingClientRect()
    engineRef.current?.trackMouse(e.clientX - rect.left, e.clientY - rect.top)
  }
}, [])
```

```ts
useEffect(() => {
  const offStream = window.electronAPI?.onAgentStream?.((chunk: string) => {
    engineRef.current?.updateStreaming(chunk)
  })
  const offStreamEnd = window.electronAPI?.onAgentStreamEnd?.(() => {
    engineRef.current?.endStreaming()
  })

  return () => {
    offStream?.()
    offStreamEnd?.()
  }
}, [])
```

Keep the existing ownership split intact:
- `App.tsx` handles pet-engine reaction to stream callbacks
- the store-driven `streaming -> petState` effect remains unless it is directly blocking the cleanup goal

- [ ] **Step 4: Run build to verify `App.tsx` compiles with the new contract**

Run: `npm run build`

Expected: PASS for `App.tsx`, or remaining FAILs only in `ChatPanel.tsx` until Task 4 is completed.

- [ ] **Step 5: Commit the `App.tsx` cleanup**

```bash
git add renderer/App.tsx
git commit -m "fix: clean up app stream subscriptions"
```

## Task 4: Clean up `ChatPanel.tsx` subscriptions and typed bridge access

**Files:**
- Modify: `renderer/ui/ChatPanel.tsx`
- Verify: `renderer/vite-env.d.ts`

- [ ] **Step 1: Write the failing lifecycle and typing check**

Read `renderer/ui/ChatPanel.tsx` and confirm these current problem points exist:

```ts
const api = (window as any).electronAPI
api?.getConfigStatus?.().then((st: any) => {
  if (st?.configured) setApiKeyConfigured(true)
  if (st?.model) setModelInput(st.model)
})
```

```ts
const api = (window as any).electronAPI
if (api?.sendToAgent) {
  api.sendToAgent({ type: 'user-chat', content })
}
```

```ts
await (window as any).electronAPI?.saveConfig?.({
  apiKey: apiKeyInput.trim(),
  provider: 'deepseek',
  model: modelInput
})
```

```ts
useEffect(() => {
  const api = (window as any).electronAPI
  api?.onAgentStream?.((chunk: string) => appendStream(chunk))
  api?.onAgentStreamEnd?.(() => commitStream())
}, [appendStream, commitStream])
```

Expected failure condition: typed bridge access is bypassed and stream listeners accumulate across remount/HMR.

- [ ] **Step 2: Run build before editing `ChatPanel.tsx`**

Run: `npm run build`

Expected: PASS or FAIL only because `ChatPanel.tsx` still does not consume the new disposer-aware contract.

- [ ] **Step 3: Write the minimal `ChatPanel.tsx` cleanup implementation**

Replace the key `any` call sites with typed access and clean up stream subscriptions:

```ts
useEffect(() => {
  window.electronAPI?.getConfigStatus?.().then((st) => {
    if (st?.configured) setApiKeyConfigured(true)
    if (st?.model) setModelInput(st.model)
  })
}, [setApiKeyConfigured])
```

```ts
const sendMessage = useCallback(() => {
  const input = inputRef.current
  if (!input?.value.trim() || streaming) return
  const content = input.value.trim()
  input.value = ''
  addMessage({ role: 'user', content, id: crypto.randomUUID() })
  setStreaming(true)

  if (window.electronAPI?.sendToAgent) {
    window.electronAPI.sendToAgent({ type: 'user-chat', content })
  } else {
    setTimeout(() => {
      appendStream('你好呀主人~ (｡･ω･｡)ﾉ♡ 请在设置中填入DeepSeek API Key即可接入AI~')
      setTimeout(() => commitStream(), 100)
    }, 500)
  }
}, [streaming, addMessage, setStreaming, appendStream, commitStream])
```

```ts
const saveConfig = useCallback(async () => {
  if (!apiKeyInput.trim()) return
  setSaving(true)
  try {
    await window.electronAPI?.saveConfig?.({
      apiKey: apiKeyInput.trim(),
      provider: 'deepseek',
      model: modelInput
    })
    setApiKeyConfigured(true)
    setApiKeyInput('')
    toggleSettings()
  } catch (e) {
    console.error(e)
  }
  setSaving(false)
}, [apiKeyInput, modelInput, setApiKeyConfigured, toggleSettings])
```

```ts
useEffect(() => {
  const offStream = window.electronAPI?.onAgentStream?.((chunk: string) => appendStream(chunk))
  const offStreamEnd = window.electronAPI?.onAgentStreamEnd?.(() => commitStream())

  return () => {
    offStream?.()
    offStreamEnd?.()
  }
}, [appendStream, commitStream])
```

Do not redesign the message flow; keep `ChatPanel.tsx` responsible for stream accumulation and commit.

- [ ] **Step 4: Run build to verify the renderer compiles end-to-end**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit the `ChatPanel.tsx` cleanup**

```bash
git add renderer/ui/ChatPanel.tsx
git commit -m "fix: clean up chat panel bridge subscriptions"
```

## Task 5: Verify startup/runtime behavior after cleanup

**Files:**
- Verify: `electron/preload.ts`
- Verify: `renderer/App.tsx`
- Verify: `renderer/ui/ChatPanel.tsx`
- Verify: `renderer/vite-env.d.ts`

- [ ] **Step 1: Run the full build verification**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 2: Run the startup verification**

Run: `npm run dev`

Expected output includes the normal startup path:

```text
VITE v5.x ready
Local: http://localhost:5173/
[main] loading: http://localhost:5173/
[main] window loaded
```

- [ ] **Step 3: Verify runtime regression targets manually**

While the app is running, check these behaviors:

```text
1. Window drag still works from the renderer surface
2. Opening chat still works after clicking the pet
3. Sending a message still starts stream accumulation in ChatPanel
4. Stream completion still commits the assistant message
5. Pet talking/end callbacks still react during and after streaming
6. No new immediate renderer bridge misuse errors appear after startup
```

Expected: all six checks succeed.

- [ ] **Step 4: Capture the final diff sanity check**

Run: `git diff -- electron/preload.ts renderer/vite-env.d.ts renderer/App.tsx renderer/ui/ChatPanel.tsx docs/superpowers/specs/2026-05-17-renderer-runtime-cleanup-design.md docs/superpowers/plans/2026-05-17-renderer-runtime-cleanup.md`

Expected: only the intended bridge contract, typing, lifecycle cleanup, and planning/spec docs are changed.

- [ ] **Step 5: Commit the verified stabilization work**

```bash
git add electron/preload.ts renderer/vite-env.d.ts renderer/App.tsx renderer/ui/ChatPanel.tsx docs/superpowers/specs/2026-05-17-renderer-runtime-cleanup-design.md docs/superpowers/plans/2026-05-17-renderer-runtime-cleanup.md
git commit -m "fix: stabilize renderer bridge lifecycle"
```

## Self-Review

- Spec coverage check:
  - Preload disposer contract → Task 1
  - Renderer type alignment → Task 2
  - `App.tsx` cleanup and typed access → Task 3
  - `ChatPanel.tsx` cleanup and typed access → Task 4
  - Build/startup/runtime verification → Task 5
- Placeholder scan:
  - No `TODO`, `TBD`, or undefined “write tests later” steps remain
- Type consistency check:
  - Listener APIs consistently return `() => void`
  - `window.electronAPI` naming is consistent across the plan
