---
type: requirement
date: 2026-05-17
number: 001
title: 全面清理渲染层运行时错误与 IPC 交互边界
source: user conversation
priority: high
---

## Requirement Source
用户在本次会话中要求：启动服务后先自查 review 代码实现；在确认修复范围时，选择“全面清理”，并要求执行 `/sybermem-record` 记录本次工作方向。

## Requirement Content
对当前 Electron + React 渲染层启动后的大量错误进行系统化治理，而不是仅做最小修补。范围包括：
- 清理 preload / renderer 间 IPC 事件监听的生命周期问题
- 修复重复注册、缺少 cleanup、HMR/重复挂载导致的监听累积问题
- 收敛 `streaming` 状态与宠物动画驱动之间的职责边界
- 清理关键 `(window as any).electronAPI` 用法，改为受类型约束的桥接调用
- 以启动后稳定性、可维护性、后续不再反复冒出运行时错误为目标

## Discussion
已完成的自查表明：
- `npm run dev` 与 `npm run build` 均可成功运行，问题不在启动链路本身
- `App.tsx` 之前对 `contextBridge.exposeInMainWorld` 暴露对象进行只读属性重写的实现已知会导致运行时崩溃，现已修正为回调注册模式
- 当前更大的隐患在于 `ipcRenderer.on(...)` 监听注册后没有退订机制，且 `App.tsx` 与 `ChatPanel.tsx` 会分别注册同类流式事件，容易在 HMR 或重复挂载后造成重复消费与行为异常
- 渲染层桥接类型已补充到 `renderer/vite-env.d.ts`，但组件层仍大量绕过类型系统，降低了编译期发现问题的能力

## Final Conclusion
本次工作按“全面清理”执行：不仅修复当前已知报错点，还要统一 IPC 监听契约、补齐订阅清理、收敛 streaming 相关职责边界，并用类型约束替代关键 `any`，以系统性降低渲染层运行时错误。

## Design Principles / Constraints
- 优先修复根因，不做临时补丁
- 变更聚焦在 preload / renderer / 状态驱动边界，不做无关重构
- 保持现有产品行为不倒退：聊天流式输出、宠物说话动画、窗口拖动等已有能力应继续可用
- 改动后需通过构建验证，并尽量复现/验证启动后行为

## Related Decisions / Changes
- `.sybermem/INDEX.md` 中已有结论：`contextBridge.exposeInMainWorld` 暴露 API 属性只读，`onAgentStream` / `onAgentStreamEnd` 必须按回调注册方式使用
- 关联文件：`renderer/App.tsx`、`renderer/ui/ChatPanel.tsx`、`electron/preload.ts`、`renderer/vite-env.d.ts`
