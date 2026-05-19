# ReqFlow — 智能协作开发平台

基于代码依赖图的需求与开发协作平台。将 **hedwig-code-graph**（多语言代码分析引擎）与 **BASIL**（需求管理工作流）缝合，实现需求→代码的双向追溯与变更影响分析。

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Gateway (:8080)                      │
├────────┬──────────┬──────────┬──────────┬───────────────────┤
│  BASIL │  BASIL   │  Graph   │  BASIL   │    Frontend       │
│  API   │ Frontend │  Engine  │  Bridge  │   (React+Viz)     │
│ :5000  │  :9000   │  :8001   │  :8002   │      :3000        │
├────────┴──────────┴──────────┴──────────┴───────────────────┤
│                     PostgreSQL (需求数据)                       │
│                  SQLite (hedwig-cg 图数据)                       │
└─────────────────────────────────────────────────────────────┘
```

## 快速启动

```bash
# 克隆项目
git clone https://github.com/knbsdb01/RepFlow.git

# 启动所有服务
docker compose up -d

# 验证服务状态
curl http://localhost:8080/graph/api/stats
```

## 服务说明

| 服务 | 端口 | 技术栈 | 功能 |
|------|------|--------|------|
| `gateway` (nginx) | 8080 | nginx:latest | API 网关，统一入口 |
| `postgres` | 5432 | postgres:15 | BASIL 需求数据存储 |
| `basil-api` | 5000 | Python Flask | 需求管理 REST API |
| `basil-frontend` | 9000 | React + Patternfly | 需求管理 UI |
| `graph-engine` | 8001 | Python FastAPI | 代码分析、图查询、影响分析 |
| `basil-bridge` | 8002 | Python FastAPI | 桥接层，连接 BASIL 与图引擎 |
| `frontend` | 3000 | React + Cytoscape.js | 依赖图可视化 |

## 路由映射

| 网关路径 | 后端服务 |
|----------|---------|
| `/basil/api/` | basil-api:5000 |
| `/graph/api/` | graph-engine:8001 |
| `/bridge/api/` | basil-bridge:8002 |
| `/viz/` | frontend:3000 |
| `/` | basil-frontend:9000 |

## 验证项目

项目使用 [RuoYi-Cloud](https://github.com/y_project/RuoYi-Cloud) 作为验证项目，挂载在容器路径 `/validation-project/`。

---

## API 接口参考

### Graph Engine (`/graph/api/`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/stats` | 图统计（节点数、边数、语言分布等） |
| GET | `/node/{node_id}` | 获取单个节点详情 |
| POST | `/build` | 解析项目构建代码图 |
| POST | `/search` | 混合搜索（自然语言 + 关键词） |
| POST | `/impact` | **影响分析** — BFS 爆照半径计算 |
| POST | `/link-requirement` | **需求链接** — 将需求绑定到代码节点 |
| GET | `/affected-nodes/{requirement_id}` | **受影响节点** — 查询某需求波及的所有代码 |
| GET | `/export` | 导出图数据（DOT/GraphML 格式） |
| GET | `/communities` | 获取社区聚类信息 |

#### 影响分析

```bash
# 分析 XssFilter.getBody 变更影响
curl -X POST http://localhost:8080/graph/api/impact \
  -H "Content-Type: application/json" \
  -d '{
    "node_id": "/validation-project/.../XssFilter.java:76",
    "max_depth": 3,
    "direction": "both"
  }'
```

参数说明:
- `node_id`: 起始代码节点 ID（文件路径+行号）
- `max_depth`: BFS 遍历深度（默认 3）
- `direction`: 遍历方向 — `forward`（调用链向下）、`backward`（反向依赖）、`both`

返回: 受影响节点列表（含深度、PageRank）、边列表、关键路径

#### 需求链接

```bash
curl -X POST http://localhost:8080/graph/api/link-requirement \
  -H "Content-Type: application/json" \
  -d '{
    "requirement_id": "1",
    "requirement_title": "REQ-001: XSS 安全过滤",
    "node_id": "/validation-project/.../XssFilter.java:76",
    "description": "实现请求体XSS过滤"
  }'
```

### BASIL API (`/basil/api/`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/user/signin` | 用户注册 | — |
| POST | `/user/login` | 用户登录 | — |
| GET | `/apis` | 软件组件列表 | token + user-id |
| POST | `/apis` | 创建软件组件 | token + user-id |
| GET | `/sw-requirements` | 需求列表 | token + user-id |
| POST | `/mapping/api/sw-requirements` | 创建需求并关联组件 | token + user-id + api-id |
| GET/POST | `/documents` | 文档 CRUD | token + user-id |
| GET | `/version` | API 版本 | — |

#### 用户注册

```bash
curl -X POST http://localhost:8080/basil/api/user/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"myuser","email":"myuser@example.com","password":"mypass"}'
```

#### 用户登录

```bash
curl -X POST http://localhost:8080/basil/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin123"}'
# 返回: {"email":"admin","id":1,"role":"ADMIN","token":"<uuid>"}
```

#### 创建需求（关联软件组件）

```bash
curl -X POST http://localhost:8080/basil/api/mapping/api/sw-requirements \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<token>",
    "user-id": 1,
    "api-id": 1,
    "section": "1",
    "offset": "0",
    "coverage": "0",
    "sw-requirement": {
      "title": "REQ-001: XSS 安全过滤",
      "description": "网关层XSS过滤描述",
      "status": "OPEN"
    }
  }'
```

### BASIL Bridge (`/bridge/api/`)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/register-component` | 注册软件组件到图引擎 |
| POST | `/build-component-graph` | 构建组件代码图 |
| POST | `/link-requirement` | 链接需求到代码节点（桥接 BASIL+Graph） |
| POST | `/analyze-impact` | 分析需求变更影响 |
| GET | `/search` | 搜索组件代码 |

---

## 目录结构

```
ReqFlow/
├── docs/                        # 文档
│   ├── workflow-report.md       # 端到端工作流验证报告
│   ├── impacted-req001-xss.json # REQ-001 受影响节点数据
│   ├── impact-req001-xss.json   # XSSFilter 影响分析结果
│   ├── impact-req002-jwt.json   # AuthFilter 影响分析结果
│   └── graph-stats.json         # 图统计快照
├── frontend/                    # React 可视化前端
│   ├── src/
│   │   ├── App.tsx              # 主应用组件
│   │   ├── GraphView.tsx        # Cytoscape.js 图组件
│   │   └── ImpactReport.tsx     # 影响分析报告组件
│   ├── Dockerfile
│   └── webpack.config.js
├── gateway/                     # Nginx 网关配置
│   └── nginx.conf
├── services/
│   ├── graph-engine/            # 图引擎服务
│   │   ├── app.py               # FastAPI 主应用
│   │   ├── impact.py            # BFS 影响分析算法
│   │   └── Dockerfile
│   └── basilext/                # BASIL 桥接服务
│       ├── bridge.py
│       └── Dockerfile
├── repos/
│   ├── BASIL/                   # BASIL 需求管理引擎
│   └── hedwig-code-graph/       # hedwig-cg 代码分析引擎
├── docker-compose.yml
├── .env
└── README.md
```

## 端到端工作流

```
提需求 → 创建 BASIL SwRequirement → 链接到代码节点 →
变更影响分析 (BFS blast radius) → 波及范围报告 → 辅助开发决策
```

详细工作流报告请参见 [docs/workflow-report.md](docs/workflow-report.md)

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `BASIL_DB_PORT` | 5432 | PostgreSQL 端口 |
| `BASIL_DB_PASSWORD` | basil_secret | 数据库密码 |
| `BASIL_ADMIN_PASSWORD` | admin123 | 管理员密码 |
| `BASIL_API_PORT` | 5000 | BASIL API 端口 |
| `GATEWAY_PORT` | 8080 | 网关端口 |
| `GRAPH_ENGINE_PORT` | 8001 | 图引擎端口 |
