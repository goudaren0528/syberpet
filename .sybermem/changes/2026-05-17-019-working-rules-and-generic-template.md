---
type: change
date: 2026-05-17
number: 019
title: 项目工作规范重构，并提炼可复用通用模板
status: implemented
author: AI
related_files: CLAUDE.md, docs/templates/CLAUDE.generic.md, .sybermem/INDEX.md
---

## Change Content
将原本主要聚焦 SyberMem 记录说明的 `CLAUDE.md` 重构为一份更完整的项目工作规范，并额外提炼一份去项目特化后的通用模板，便于后续在其他项目中复用。

### 核心变更
1. **重写项目级 `CLAUDE.md`**
   - 从单一的 SyberMem 说明扩展为完整工作规则。
   - 新增高优先级规则、架构边界、代码质量、搜索与上下文、验证完成标准、commit 规范、文档规则与禁止事项。
   - 明确要求：涉及旧功能或与旧功能关联的新功能时，必须先搜索代码与历史记录，再判断和修改。

2. **补上 README 同步约束**
   - 新规则明确要求：当行为、使用方式、架构摘要、工作流或开发说明发生变化时，应同步更新 `README.md`。
   - 即使仓库当前尚无 `README.md`，该约束仍作为后续项目文档治理基线保留。

3. **提炼通用模板**
   - 新增 `docs/templates/CLAUDE.generic.md`。
   - 去掉 SyberPet 特有的技术栈、目录边界和交互细节，只保留通用工程规范，可直接作为其他项目的起始模板。

## Reason for Change
现有 `CLAUDE.md` 主要解决记录流程问题，但对 AI/工程协作中的搜索前置、变更边界、验证标准、commit 纪律和文档同步约束覆盖不足。此次重构是为了把项目长期协作规则集中到一份短而硬的规范里，并同时沉淀一个可复用模板，减少后续项目重复整理成本。

## Impact Scope
- `CLAUDE.md` — 项目专用工作规范全面重构
- `docs/templates/CLAUDE.generic.md` — 新增通用规范模板
- `.sybermem/INDEX.md` — 增加 change record 与关键结论

## Verification
- 人工审阅新规则结构，确认覆盖架构、代码质量、commit、SyberMem、README 同步等主要治理点
- 人工审阅通用模板，确认已去除 SyberPet 特化约束并保留可迁移规则
