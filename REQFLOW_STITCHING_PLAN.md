# ReqFlow 智能协作开发平台 — 缝合计划

## 概述

将多个成熟开源项目的核心能力组合，构建以**全局依赖图为核心**的智能协作开发平台。

---

## 一、功能模块与开源项目映射

| PRD 模块 | 核心需求 | 最佳开源项目 | 整合策略 |
|----------|---------|-------------|---------|
| **依赖图引擎** 🥇 | AST解析、图存储、增量更新 | **[hedwig-code-graph](https://github.com/hedwig-ai/hedwig-code-graph)** ⭐6 → 替代原 code-graph-rag | **核心引擎** — Python, Tree-sitter 20+语言, NetworkX+SQLite+FAISS, MCP, 混合搜索 |
| **代码可视化** | 交互式图、下钻、搜索 | [DependaCharta](https://github.com/MaibornWolff/DependaCharta) (参考UI) + Cytoscape.js | 参考其 Cytoscape.js 交互设计, 自建 React 前端 |
| **需求管理** | 工作项、追溯、审批、版本 | [BASIL](https://github.com/elisa-tech/BASIL) | **核心适配** — Python Flask API + React 前端, 完整工作流 |
| **代码度量** | 复杂度、死代码、依赖图 | [Omen](https://github.com/panbanda/omen) | CLI 集成, 作为分析管道的一环 |
| **架构治理** | 违规检测、CI门禁 | [Revos](https://github.com/mattykry/revos) | CLI 集成, CI/CD 门禁 |
| **分支感知** | 分支↔图映射, 增量 | [GitCortex](https://github.com/bharath03-a/GitCortex) (设计参考) | 参考其 KuzuDB + 分支命名空间设计 |
| **AI 代理** | NL查询、MCP | [hedwig-code-graph](https://github.com/hedwig-ai/hedwig-code-graph) (MCP内置) + [Anvil](https://github.com/esanmohammad/Anvil) | MCP 协议对接 Claude Code, 混合搜索(5路信号融合) |
| **需求版本** | Git原生需求管理 | [Doorstop](https://github.com/doorstop-dev/doorstop) | 参考设计理念 |

---

## 二、系统架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ReqFlow Platform                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Frontend (React + TypeScript)               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│  │  │  全景图视图    │  │  需求管理面板  │  │  影响分析视图    │   │   │
│  │  │(Cytoscape.js) │  │ (BASIL UI适配) │  │ (子图+时序图)   │   │   │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │   │
│  └─────────┼─────────────────┼──────────────────┼───────────────┘   │
│            │                 │                   │                   │
│  ┌─────────▼─────────────────▼───────────────────▼───────────────┐  │
│  │              API Gateway (FastAPI + Flask)                     │  │
│  │  · 统一认证/权限 · 工作流引擎 · 事件总线 · WebSocket          │  │
│  └────┬──────────────┬───────────────────┬───────────────────────┘  │
│       │              │                   │                          │
│  ┌────▼──────┐  ┌────▼────────┐  ┌──────▼──────────────────────┐   │
│  │ Graph     │  │ Requirements│  │ Code Analysis Pipeline       │   │
│  │ Engine    │  │ Engine      │  │                              │   │
│  │           │  │ (BASIL Core)│  │  ┌─────────┐ ┌──────────┐   │   │
│  │ · Memgraph│  │ · WorkItems │  │  │ Omen    │ │ Revos    │   │   │
│  │ · Tree-   │  │ · Traceabil │  │  │(metrics)│ │(arch gov)│   │   │
│  │   sitter  │  │ · Impact    │  │  └─────────┘ └──────────┘   │   │
│  │ · NL2Cypher│  │   Analysis  │  │                              │   │
│  · MCP      │  │ · Export    │  │                              │   │
│  └──────────┘  └─────────────┘  └──────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │               Integration Layer                                │   │
│  │  · DingTalk Webhook · Yuque API · Dima CLI/API               │   │
│  │  · MCP Server (Claude Code) · Email · Webhook                │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 三、技术栈选择

| 层 | 技术选型 | 理由 |
|----|---------|------|
| **后端核心** | Python (FastAPI + Flask) | hedwig-code-graph + BASIL 均为 Python, 统一栈 |
| **图数据库** | NetworkX + SQLite (嵌入式) | hedwig-code-graph 使用, 无需外部DB依赖; 可选迁移到 Memgraph |
| **代码解析** | Tree-sitter | 多语言支持, 增量解析, 社区活跃 |
| **前端** | React + TypeScript + Patternfly | BASIL 已有, 可复用 |
| **图可视化** | Cytoscape.js | 交互式力导向图, DependaCharta 已验证 |
| **AI 集成** | MCP 协议 + LLM API | hedwig-code-graph 内置 MCP + 混合搜索(5路信号融合) |
| **关系数据库** | PostgreSQL | BASIL 原生支持 |
| **容器化** | Docker / Podman | 所有项目均支持 |

---

## 四、实施阶段

### Phase 1: 基础平台搭建 (2-3周)
1. Fork hedwig-code-graph 作为核心图引擎
   - 集成 Tree-sitter 20+语言 AST 解析
   - 搭建 MCP Server + 混合搜索
   - 利用 SQLite/NetworkX 本地存储 (零外部依赖)
2. BASIL 核心适配
   - 部署 BASIL API + PostgreSQL
   - 将 BASIL 的需求模型映射到图节点
   - 适配前端 UI 作为 ReqFlow 的管理面板
3. 统一 API Gateway
   - FastAPI 统一入口
   - 统一认证/权限

### Phase 2: 核心功能开发 (3-4周)
1. 全景图功能
   - 集成 Cytoscape.js 交互式依赖图
   - 实现层级下钻 (服务→模块→文件→函数)
   - 实现智能搜索 (自然语言搜节点)
2. 需求与图的联动
   - 需求变更 → 自动标注受影响图节点
   - 影响分析报告生成
3. 增量更新
   - Git hooks 触发增量解析
   - 图版本与分支关联

### Phase 3: 协作与集成 (2-3周)
1. 工作流引擎
   - 需求预演/确认流程
   - 钉钉/邮件通知
   - 审批留痕
2. 生态集成
   - 语雀文档自动生成
   - Dima 任务自动创建
   - Claude Code MCP 集成
3. 需求版本控制
   - 图的版本历史
   - 分支图对比

### Phase 4: 增强与优化 (持续)
1. AI 增强
   - NL2Cypher 自然语言图查询
   - 自动生成系统分析文档
   - AI 辅助代码审查
2. 代码度量集成
   - Omen 复杂度/死代码检测
   - Revos 架构违规门禁
3. 性能优化
   - 大图局部加载
   - 搜索索引优化

---

## 五、已获取代码

### ✅ 已克隆到本地
| 项目 | 路径 | 用途 |
|------|------|------|
| [BASIL](https://github.com/elisa-tech/BASIL) | `repos/BASIL/` | 需求管理工作流核心 (Python Flask + React) |
| [hedwig-code-graph](https://github.com/hedwig-ai/hedwig-code-graph) | `repos/hedwig-code-graph/` | **核心图引擎替代品** (Python, Tree-sitter 20+语言, NetworkX+SQLite, MCP) |
| [Canopy](https://github.com/LioraLabs/canopy) | `repos/canopy/` | 备选图引擎 (Rust, redb+usearch), 作性能对比参考 |

### ⚡ 待网络恢复后克隆
| 项目 | 预计用途 | 克隆命令 |
|------|---------|---------|
| [Omen](https://github.com/panbanda/omen) | 代码度量CLI | `git clone https://github.com/panbanda/omen.git` |
| [Revos](https://github.com/mattykry/revos) | 架构治理 | `git clone https://github.com/mattykry/revos.git` |
| [Doorstop](https://github.com/doorstop-dev/doorstop) | 需求版本设计参考 | `git clone https://github.com/doorstop-dev/doorstop.git` |

---

## 六、"缝合"关键决策

### 决策1: hedwig-code-graph vs Canopy vs 自建图引擎
**结论: Fork hedwig-code-graph 作为核心引擎, Canopy 作性能参考**
- hedwig-code-graph: Python 栈 (与 BASIL 一致), Tree-sitter 20+语言, NetworkX+SQLite+FAISS, MCP内置, 混合搜索(5路信号)
- Canopy: Rust 栈, redb+usearch, 更高性能但语言栈不一致, 集成成本高
- 需要扩展 hedwig-code-graph: 分支感知 (参考 GitCortex 设计)、增量更新、Web 可视化

### 决策2: BASIL 完整集成 vs 仅参考其模型
**结论: BASIL 做需求管理后端，Re-export 其React组件**
- BASIL 有完整的 REST API + 工作流 + 追溯 + CI/CD
- 将 BASIL 的需求/文档/用例数据模型映射到图节点
- React 前端在 BASIL 基础上扩展全景图视图

### 决策3: 可视化方案
**结论: Cytoscape.js + 自研**
- DependaCharta 已验证 Cytoscape.js 在大规模依赖图中的可行性
- 参考 reality-map 的 drill-down 交互模式
- 参考 Mammutmap 的无限缩放理念

### 决策4: 增量更新策略
**结论: Git hooks + diff parser**
- 参考 GitCortex: git hooks 触发, 仅解析变更文件
- 参考 hedwig-code-graph: Tree-sitter + git co-change 增量解析
- 图版本与 git commit SHA 关联

---

## 七、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 多项目技术栈不一致 | 集成成本高 | 统一 Python + React, CLI工具通过子进程调用 |
| Memgraph 运维复杂 | 部署困难 | Docker Compose 一键部署, 提供 Managed 模式 |
| BASIL 工作流不匹配PRD | 需要大量修改 | 提前评估 BASIL API 的可扩展性, 必要时仅参考模型层 |
| 大型项目解析性能 | 图加载慢 | 局部加载 + 惰性加载 + 搜索索引 |
| 网络无法访问 GitHub | 无法获取源码 | 提供手动克隆命令, 用户可自行执行 |

---

## 八、总结

| 维度 | 评估 |
|------|------|
| **最核心的缝合** | hedwig-code-graph (图引擎) + BASIL (需求管理) |
| **技术统一性** | 均为 Python 生态, 集成成本低 |
| **差异化优势** | 全局依赖图 ↔ 需求联动, 这是市场上没有的 |
| **最快可行路径** | Phase 1 即可获得: 代码分析 + 需求管理 + 图查询 |
