# Renderer Runtime Cleanup Design

Date: 2026-05-17
Status: approved-in-chat, awaiting written-spec review

## Goal

Stabilize renderer runtime behavior after app startup by fixing the IPC subscription contract, adding lifecycle cleanup, tightening renderer typing, and reducing responsibility overlap around streaming-driven pet animation.

This is a focused stabilization effort, not a broad product refactor.

## Current Findings

From direct review and verification:

- `npm run dev` starts successfully and Electron loads the renderer
- `npm run build` passes successfully
- The previously known crash caused by reassigning `contextBridge.exposeInMainWorld` properties in `renderer/App.tsx` has already been corrected
- The larger remaining risk is that preload exposes event registration APIs backed by `ipcRenderer.on(...)` without any unsubscribe contract
- Both `renderer/App.tsx` and `renderer/ui/ChatPanel.tsx` subscribe to stream events and currently do not clean them up
- The renderer now has a declared `window.electronAPI` type, but important call sites still bypass it with `(window as any)`

## Scope

In scope:

1. `electron/preload.ts`
2. `renderer/vite-env.d.ts`
3. `renderer/App.tsx`
4. `renderer/ui/ChatPanel.tsx`
5. Related streaming/pet-state coordination as needed to remove boundary confusion

Out of scope:

- Rebuilding the whole renderer architecture
- Redesigning chat UX
- Large refactors unrelated to runtime stability
- Main process business logic changes unless strictly required by the bridge contract cleanup

## Approaches Considered

### Option 1: Local patching only
Keep the preload API as-is and patch duplicate listener behavior inside renderer components.

Why not chosen:
- It does not fix the missing unsubscribe contract
- It leaves HMR/remount leak risk in place
- It treats symptoms instead of the lifecycle root cause

### Option 2: Bridge contract + lifecycle cleanup
Update preload listener APIs to return unsubscribe functions, type them in the renderer, and ensure React effects clean up subscriptions.

Why chosen:
- Fixes the root contract problem directly
- Keeps changes concentrated in the bridge boundary and subscribing components
- Reduces future runtime regressions without over-expanding scope

### Option 3: Full interaction-layer redesign
Introduce a dedicated renderer bridge layer or hook abstraction and reorganize stream/event handling more broadly.

Why not chosen now:
- Valid long-term direction, but too large for the current stabilization goal
- Raises risk and scope for an issue that can be solved cleanly with a smaller architectural correction

## Chosen Design

### 1. Preload event APIs return disposers

The preload bridge will expose event subscription methods that return an unsubscribe function.

Target shape:
- `onAgentMessage(callback): () => void`
- `onAgentStream(callback): () => void`
- `onAgentStreamEnd(callback): () => void`
- `onContextMenu(callback): () => void`

Behavioral rule:
- Each registration must attach exactly one Electron listener
- The returned disposer must remove exactly that listener

This makes the bridge safe for React lifecycle usage and HMR/remount scenarios.

### 2. Renderer typings become the source of truth

`renderer/vite-env.d.ts` will be updated to match the actual preload contract, including disposer return types.

Renderer components should prefer `window.electronAPI` over `(window as any).electronAPI` at the main call sites touched by this cleanup.

Goal:
- Move bridge drift detection earlier into TypeScript instead of discovering mismatches at runtime

### 3. React subscriptions always clean up

`renderer/App.tsx` and `renderer/ui/ChatPanel.tsx` will register stream listeners in effects and always return cleanup functions.

Lifecycle rule:
- Every subscription created in an effect must be disposed in the effect cleanup
- No listener registration should rely on process-lifetime assumptions inside React components

This directly addresses repeated registration and remount accumulation.

### 4. Streaming responsibility boundaries are tightened

Current behavior uses two related mechanisms:
- chat/store streaming state for UI message flow
- direct stream callbacks for pet engine reactions

The cleanup will preserve working behavior, but reduce ambiguity in ownership:
- ChatPanel remains responsible for chat stream accumulation/commit behavior
- App remains responsible for pet-engine reactions to stream activity
- The implementation should avoid hidden cross-layer coupling or redundant lifecycle behavior

This is a boundary cleanup, not a full state model redesign.

### 5. Verification strategy

The implementation will be validated through:

1. Type/build verification
   - `npm run build`
2. Startup verification
   - `npm run dev`
3. Runtime review
   - confirm no immediate startup/runtime breakage from bridge typing and listener cleanup
4. Regression focus
   - chat stream still updates UI
   - pet stream callbacks still drive talking/end behavior
   - no new bridge invocation errors

## Risks and Mitigations

### Risk: preload contract change breaks renderer assumptions
Mitigation:
- Update `vite-env.d.ts` and component usage in the same change set
- Keep API names stable; only improve return contract

### Risk: cleanup introduces accidental loss of listeners
Mitigation:
- Use one registration per effect and one disposer per registration
- Keep listener creation local and explicit

### Risk: scope expansion into broader app refactor
Mitigation:
- Limit edits to bridge contract, typed access, lifecycle cleanup, and streaming-boundary clarifications directly needed for stability

## Testing Notes

This task should be implemented with verification around the changed bridge behavior and startup/runtime flow. The focus is regression prevention for listener lifecycle and renderer bridge usage.

## Success Criteria

The design is successful when:

- preload listener APIs support unsubscribe
- renderer typings match the real bridge contract
- `App.tsx` and `ChatPanel.tsx` clean up their subscriptions
- key `electronAPI` call sites no longer rely on `any`
- the app still builds and starts successfully
- startup-time runtime errors related to repeated event registration and bridge misuse are reduced or eliminated
