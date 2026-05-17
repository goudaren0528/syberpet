---
type: change
date: 2026-05-17
number: 005
title: 宠物形象从紫色 blob 升级为精致猫咪角色
status: implemented
author: AI
related_files: renderer/pet/engine.ts
---

## Change Content
完全重写 `renderer/pet/engine.ts` 中的宠物程序化绘制，从简陋的紫色椭圆+三角耳升级为可爱的奶油色猫咪角色。

### 新增视觉元素
- **身体**: 奶油色主体 + 淡色肚皮区域 + 耳朵轮廓描边
- **耳朵**: 三角耳内部粉色填充 + 耳朵抽动动画
- **眼睛**: 大号动漫风瞳孔 + 双高光（主高光+副高光）
- **鼻子**: 倒三角猫鼻
- **嘴巴**: "w" 形猫嘴（idle）/ 张嘴+舌头（talking）/ 微笑弧线（sleeping）
- **胡须**: 每侧三根，半透明
- **爪子**: 椭圆形脚掌 + 肉垫细节
- **尾巴**: 贝塞尔曲线绘制，持续摆动动画（说话时加速）
- **阴影**: 脚下椭圆投影

### 新增动画
- 尾巴摇摆（状态感知速度）
- 耳朵抽动 idle 动作
- 腮红亮度脉动
- 说话时舌头显现

### 配色系统
5 种状态各有独立暖色调配色方案：idle=奶油色、sleeping=深奶油、talking=暖黄、thinking=淡紫、working=淡蓝

## Reason for Change
原宠物形象过于简陋（纯色椭圆+三角形），缺乏辨识度和可爱感，用户体验反馈形象太简单。

## Impact Scope
- 仅影响 `renderer/pet/engine.ts`
- 不改变状态管理、IPC 通信等逻辑
- 公共 API（setAnimation、trackMouse、bounce 等）保持不变

## Test Verification
TypeScript 编译通过，零错误。公共接口签名未变，与 App.tsx 的集成无需修改。
