---
type: decision
date: 2026-05-17
number: 001
title: Phase 2 采用长期记忆优先，并将画像与工具作为派生层和接口层
status: decided
author: AI
related_files: docs/superpowers/specs/2026-05-17-phase-2-memory-profile-tools-design.md, docs/superpowers/plans/2026-05-17-phase-2-memory-profile-tools-implementation.md, .sybermem/INDEX.md
---

## Context
SyberPet 的 Phase 2 原计划同时包含长期记忆、用户画像和工具系统，但当前代码基础只有短期记忆、基础 Agent Core、消息队列和轻量配置能力。如果三者同时作为第一阶段主交付，会放大范围并分散实现重心。

用户在本次讨论中明确希望三者统一设计，但实现顺序上优先长期记忆；长期记忆第一版只聚焦对话中的长期事实、偏好和约定，采用保守提取、保守去重、关键词/规则检索优先的路线。

## Options Considered

### Option 1: 只先做长期记忆
优点：范围最小，能最快做出“记得住”的效果。
缺点：画像和工具边界后补，后续容易回头重构。

### Option 2: 统一设计三层边界，但第一阶段只以长期记忆闭环为成功标准
优点：既能先把记忆价值做实，又能保证 profile 和 tools 建立在稳定底座上。
缺点：设计工作略多，需要严格控制范围。

### Option 3: 三者最小闭环同时落地
优点：功能看起来最完整。
缺点：第一阶段容易超范围，工具系统会反客为主。

## Decision
采用 **Option 2**。

Phase 2 第一阶段统一采用三层结构：
- `Memory Layer` 作为 source of truth，负责长期记忆条目存储、提取、去重、冲突处理和检索
- `Profile Layer` 作为从长期记忆派生的轻量结构化用户视图
- `Tool Layer` 作为内部能力接口层，第一版只暴露最小 internal tools

实施顺序固定为：
1. 先完成 `Memory Core`
2. 再补 `Derived Profile`
3. 最后补 `Internal Tools`

## Consequences

### Positive
- 第一阶段成功标准清晰：先建立长期记忆闭环
- profile 不会演变成第二套事实源
- tool layer 可以复用稳定的 memory/profile 能力，而不是反向驱动底层设计
- 后续若引入更强检索或外部工具，仍可保留当前分层

### Trade-offs
- 第一阶段不会立即获得完整工具体验
- profile 在第一阶段只作为派生能力，不是主交付价值
- 为了保证低噪音，需要接受第一版“少记但准记”的保守策略

## Follow-up Artifacts
- Design spec: `docs/superpowers/specs/2026-05-17-phase-2-memory-profile-tools-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-17-phase-2-memory-profile-tools-implementation.md`
