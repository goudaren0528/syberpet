# SyberPet Todo

Date: 2026-05-18
Status: active

## Related Design / Plan
- Experience skeleton design: `docs/superpowers/specs/2026-05-17-experience-skeleton-design.md`
- RPS mini-game design: `docs/superpowers/specs/2026-05-18-rps-mini-game-skeleton-design.md`
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
- [x] 明确猜拳 mini-game skeleton 的入口、玩法态、规则层与奖励模型，并写成设计 spec

### In Progress
- [ ] 猜拳 mini-game implementation plan

### Next
- [ ] 为猜拳规则层补 TDD 测试与最小实现
- [ ] 接上右键菜单、输入条与气泡反馈闭环
- [ ] 验证 interaction / regression paths
- [ ] 如有必要，补充 README 中与体验骨架相关的行为说明

## Notes
- 当前主发送路径是 `renderer/ui/InputBar.tsx`，奖励逻辑已接在此处；猜拳也应优先复用这条路径。
- 猜拳第一版采用本地轻量规则：右键入口 + 输入条出拳 + 宠物气泡反馈，不走 LLM 判定。
- `renderer/ui/ChatPanel.tsx` 仍保留旧发送路径，但当前不是主界面入口；若后续重新启用，需要同步奖励与玩法逻辑。
- `agent-config.json` 当前工作区含有本地敏感配置变更，不应提交到仓库。
