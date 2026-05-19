# ReqFlow 文档

## 目录

- [**workflow-report.md**](workflow-report.md) — 端到端工作流验证报告
  - 验证流程与 API 调用序列
  - 创建的数据 (需求、组件)
  - 影响分析报告 (XSS 变更 / JWT 变更)
  - AI 辅助开发决策分析

## 原始数据

| 文件 | 大小 | 说明 |
|------|------|------|
| [graph-stats.json](graph-stats.json) | 3.2 KB | 图统计快照 (节点/边/语言/PageRank) |
| [affected-req001-xss.json](affected-req001-xss.json) | 78 KB | REQ-001 所有受影响节点 (25个) |
| [impact-req001-xss.json](impact-req001-xss.json) | 28 KB | XssFilter.getBody 变更影响分析 |
| [impact-req002-jwt.json](impact-req002-jwt.json) | 74 KB | AuthFilter 变更影响分析 (45个节点) |
