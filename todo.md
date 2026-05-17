# SyberPet Todo

Date: 2026-05-17
Status: active

## Related Design / Plan
- Design: `docs/superpowers/specs/2026-05-17-experience-skeleton-design.md`
- Plan: `C:/Users/lenovo/.claude/plans/quirky-plotting-lightning.md`
- Related requirement: `.sybermem/requirements/2026-05-17-002-experience-skeleton-chat-history-and-light-play.md`

## Progress Snapshot

### Completed
- [x] 稳定拖动链路，恢复轻量桌宠交互基础
- [x] 移除主界面右侧重聊天入口，改为底部 `InputBar`
- [x] assistant 回复走宠物气泡，不回退为重聊天面板
- [x] 压缩 HUD 成为更弱化的头顶状态带
- [x] 对话节奏拆分为 `thinking -> streaming`，避免过早 talking
- [x] 右键菜单接入只读历史面板，并让气泡回复同步进入记录
- [x] 接入规则型属性增长：聊天 / 喂食 / 鼓励恢复 分别影响 needs
- [x] 修复 `renderer/store/state.ts` 被工具元文本污染的问题

### In Progress
- [ ] 猜拳 mini-game skeleton

### Next
- [ ] 验证 interaction / regression paths
- [ ] 检查猜拳入口与右键菜单、输入条、气泡反馈是否按设计闭环
- [ ] 如有必要，补充 README 中与体验骨架相关的行为说明

## Notes
- 当前主发送路径是 `renderer/ui/InputBar.tsx`，奖励逻辑已接在此处。
- `renderer/ui/ChatPanel.tsx` 仍保留旧发送路径，但当前不是主界面入口；若后续重新启用，需要同步奖励与玩法逻辑。
- `agent-config.json` 当前工作区含有本地敏感配置变更，不应提交到仓库。
