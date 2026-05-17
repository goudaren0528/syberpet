# SyberPet Experience Skeleton Design

Date: 2026-05-17
Status: proposed

## Context

SyberPet 已经具备桌宠主界面、底部轻量输入条、宠物气泡回复、基础属性持久化、以及相对稳定的窗口拖动行为。当前产品形态已经有“桌面宠物”的基础感觉，但还缺少更明确的互动节奏、历史可回看入口，以及和聊天行为更紧密的养成反馈。

本次目标不是把 SyberPet 一次性扩展成完整养成游戏，而是先建立一个稳定的“体验骨架”：
- 对话时的状态切换更自然
- 用户可以回看最近对话
- 普通聊天与特定互动能推动宠物属性变化
- 内置一个最轻量的互动玩法样板，验证聊天式玩法路径可行

## Goals

1. 发送消息后，宠物先进入 `thinking`，只有在真正收到回复内容时才进入 `talking`
2. 提供一个只读的最近对话记录面板，用户可从右键菜单查看双方最近对话
3. 建立规则型轻量属性增长：普通聊天、喂食类表达、恢复/任务类表达分别影响不同属性
4. 内置一个超轻量互动玩法样板：猜拳
5. 保持现有桌宠主交互形态，不回退到常驻聊天面板产品形态

## Non-Goals

本次明确不做：
- 多会话管理
- 历史搜索、筛选、导出
- 复杂任务系统、连续剧情系统、库存/道具系统
- 多玩法集合
- 把属性判定完全交给 LLM
- 重型 UI 重构或恢复旧右侧聊天面板

## User Experience Design

### Main Interaction Shape

主界面继续保持当前轻桌宠形态：
- 宠物本体
- 宠物气泡
- 底部 `InputBar`
- 头顶轻量属性条

不恢复常驻右侧聊天面板。聊天的主要感知方式仍然是“桌宠附近冒泡 + 宠物动作状态”。

### Right-Click Menu Extensions

右键菜单补充作为功能入口，新增/保留：
- 设置
- 对话记录
- 互动玩法（猜拳）
- 退出

这样主界面保持干净，而扩展功能仍然可达。

### Read-Only Conversation History

“对话记录”是一个只读回看面板，不承担主聊天入口职责。

面板行为：
- 显示最近 N 条对话
- 同时显示用户与宠物双方消息
- 不允许在该面板直接发送消息
- 不做多标签、多会话、搜索等复杂能力
- 关闭后回到桌宠主界面

推荐最近消息数量：30–50 条，优先使用固定窗口上限（例如 40 条）。

## Conversation State and Flow

### Separation of Dialogue Phase and Pet Animation State

建议把“对话阶段”与“宠物动画状态”分开表达。

对话阶段建议新增/明确：
- `idle`
- `thinking`
- `streaming`

宠物动画状态继续使用现有 `petState`：
- `thinking` 阶段 → `petState = 'thinking'`
- `streaming` 阶段 → `petState = 'talking'`
- 完成后根据能量回到 `idle` 或 `sleeping`

这样“业务流程阶段”和“表现层动画”不会混成一个状态源。

### Message Flow

一次对话的状态流转如下：

1. 用户发送消息
   - 输入被接收
   - 用户消息写入最近对话记录
   - 对话阶段进入 `thinking`
   - 宠物进入 `thinking`

2. 等待首个 chunk
   - 保持 `thinking`
   - 输入条显示轻加载提示
   - 不进入 `talking`

3. 收到首个 chunk
   - 对话阶段切换到 `streaming`
   - 宠物进入 `talking`
   - 继续累积流式文本

4. 回复完成
   - assistant 消息写入最近对话记录
   - 最终回复显示为宠物气泡
   - 对话阶段回到 `idle`
   - 宠物根据能量回到 `idle` 或 `sleeping`

### Error Behavior

如果请求失败、流中断、或未得到有效回复：
- 退出 `thinking` / `streaming`
- 宠物回到 `idle` 或 `sleeping`
- 用短气泡提示用户本次回复失败
- 不留下卡死在 thinking/talking 的状态

## Conversation History Design

### Data Source

保留并规范 `messages: ChatMessage[]` 作为最近对话记录源。

写入规则：
- 用户发送成功时写入一条 user message
- assistant 回复完整结束后写入一条 assistant message
- 主界面不直接渲染 `messages`
- 只读记录面板消费 `messages`

### Persistence Strategy

第一版建议采用以下顺序：
1. 先确保 store 内最近消息工作正常
2. 再决定是否做本地持久化

推荐第一版支持本地持久化，但只存最近 N 条，避免无界增长。若实施持久化，应沿用现有主进程本地文件保存模式，与 `pet-data.json` 类似，但使用单独的历史记录文件。

## Pet Need Growth Rules

### Rule Model

采用本地规则型轻量判定，不把属性奖励完全依赖于 LLM。

判定优先级：
1. 特定互动/玩法状态
2. 关键词命中
3. 普通聊天兜底

### First-Version Mapping

#### Mood
普通成功聊天互动即可增加 `mood`。

建议：
- 每轮正常对话完成后 `mood +1 ~ +3`

#### Hunger
仅在命中喂食/吃东西类表达时增加 `hunger`。

示例关键词：
- 喂你
- 吃点
- 请你吃
- 小鱼干
- 点心
- 汉堡
- 甜点

建议：
- `hunger +8 ~ +15`
- 可附带 `mood +1 ~ +2`

#### Energy
在恢复/完成任务/学习工作/鼓励类表达时增加 `energy`。

示例关键词：
- 休息
- 睡觉
- 辛苦了
- 完成任务
- 下班了
- 学习完了
- 继续加油

建议：
- `energy +6 ~ +12`
- 可附带少量 `mood`

### Design Principle

该规则需要满足：
- 可解释
- 奖励幅度不夸张
- 不因一次对话将属性拉满
- 后续可逐步扩展为更细语义判定而不推翻结构

## Built-In Mini Game: Rock Paper Scissors

### Purpose

猜拳不是本次主系统，而是“聊天式互动玩法可行”的样板能力。

### Entry Points

第一版入口：
- 右键菜单 → 互动玩法（猜拳）

可兼容后续文本入口：
- 用户直接输入“猜拳 / 石头剪刀布 / 来玩一局”

### Flow

1. 用户从右键菜单进入猜拳
2. 宠物气泡提示用户输入：石头 / 剪刀 / 布
3. 系统进入“等待出拳”的轻玩法状态
4. 用户在输入条中输入拳型
5. 宠物随机出拳
6. 气泡反馈结果
7. 发放轻量奖励并退出玩法状态

### Reward Model

建议奖励：
- 只要完成一局：`mood +3`
- 若用户赢：额外 `energy +2`
- 若平局或输：不惩罚，仅保留基础陪伴奖励

### Out of Scope

本次不做：
- 连胜/连败机制
- 排行榜
- 玩法库存/代币
- 多回合复杂玩法树

## Architectural Design

### Store Changes

`renderer/store/state.ts` 需要扩展为能够表达：
- 对话阶段（thinking / streaming）
- 最近对话记录的标准写入路径
- 轻量玩法状态（猜拳等待中/本轮结果）
- 规则型属性奖励入口

建议保持 store 轻量，不把复杂判定塞进 UI 组件。

### Rule Evaluation Layer

建议新增一个轻量的本地规则判定层，职责单一：
- 输入：用户文本 + 当前轻玩法状态
- 输出：
  - 本次互动类别
  - 属性增量
  - 是否进入/推进玩法流程

示意输出形态：
- `kind: 'chat' | 'feed' | 'energy' | 'game:rps:start' | 'game:rps:move'`
- `delta: { mood?: number; hunger?: number; energy?: number }`

该层应尽量纯逻辑、可测试、无 UI 依赖。

### UI Components

建议涉及：
- `renderer/App.tsx`
  - 负责右键菜单扩展
  - 管理只读记录面板显隐
  - 协调 petState 与对话阶段
- `renderer/ui/InputBar.tsx`
  - 负责发送后进入 thinking
  - 显示轻加载提示
  - 兼容猜拳输入流程
- 新增只读记录面板组件
  - 只读展示 `messages`
  - 不承担主输入能力
- `renderer/pet/phrases.ts`
  - 可扩展思考、失败、猜拳结果等文案

### IPC / Persistence Boundary

尽量保持第一版主要在 renderer 内完成。只有在需要本地持久化“最近对话记录”时，再增补最小 IPC：
- preload 暴露读取/保存历史的能力
- renderer typings 同步更新
- main process 负责本地文件落盘

如果本轮要引入记录持久化，必须一起更新 preload、renderer typings、main process 与调用处，避免 IPC 合约漂移。

## Implementation Order

推荐按以下顺序落地：

1. 对话阶段拆分
   - sending → thinking
   - first chunk → talking
   - end/error → idle/sleeping

2. 只读记录面板
   - 规范 `messages` 写入
   - 增加右键菜单入口
   - 新增只读记录 UI

3. 规则型属性增长
   - 普通聊天 → mood
   - 喂食类关键词 → hunger
   - 恢复/任务类关键词 → energy

4. 猜拳玩法骨架
   - 菜单进入
   - 输入出拳
   - 结果反馈
   - 小额奖励

## Verification Plan

### Functional Checks

- 发送消息后宠物先进入 `thinking`
- 收到首个回复 chunk 后才进入 `talking`
- 回复完成后恢复正常状态
- 右键菜单可打开只读对话记录
- 记录中能看到双方最近对话
- 普通聊天会增加 `mood`
- 喂食类表达会增加 `hunger`
- 恢复/任务类表达会增加 `energy`
- 猜拳可以完整走通一轮并发放奖励

### Regression Checks

- 不破坏当前输入条发送路径
- 不破坏气泡回复显示
- 不破坏拖动稳定性
- 不破坏设置入口与现有右键菜单行为
- 不破坏 pet needs 的现有本地持久化

## Recommendation

把本次版本定义为：

> 把 SyberPet 从“能聊的桌宠”推进到“有思考节奏、可回看历史、可被互动养成，并具备一个聊天式玩法样板”的体验骨架版本。

这是一个足够明显的产品跃迁，但仍然保持范围可控、结构清晰、实现风险低。