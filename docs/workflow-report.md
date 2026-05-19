# ReqFlow 端到端工作流验证报告

> 验证日期: 2026-05-19
> 验证项目: [RuoYi-Cloud](https://github.com/y_project/RuoYi-Cloud) (v3.8.7)
> 图数据库: 3,525 节点 / 4,148 边

---

## 一、验证流程

### 完整端到端链路

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        端到端工作流                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ① 用户登录 BASIL         →  POST /user/login                              │
│      │                                                                     │
│  ② 创建软件组件           →  POST /apis                                    │
│      │                                                                     │
│  ③ 创建需求 (SwRequirement) →  POST /mapping/api/sw-requirements          │
│      │                                                                     │
│  ④ 需求 → 代码节点链接     →  POST /graph/api/link-requirement            │
│      │                                                                     │
│  ⑤ 需求变更影响分析       →  POST /graph/api/impact                      │
│      │                        (BFS blast radius)                           │
│  ⑥ 获取受影响节点         →  GET  /graph/api/affected-nodes/{req_id}     │
│      │                                                                     │
│  ⑦ 查看图统计概览         →  GET  /graph/api/stats                       │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 涉及的 API 调用序列

```bash
# ========== Step 1: 登录 ==========
curl -X POST http://localhost:8080/basil/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin123"}'
# → {"id":1, "role":"ADMIN", "token":"22a88d60-..."}

# ========== Step 2: 创建软件组件 ==========
curl -X POST http://localhost:8080/basil/api/apis \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<token>",
    "user-id": 1,
    "api": "RuoYi-Cloud Gateway",
    "library": "RuoYi-Cloud",
    "library-version": "3.8.7",
    "raw-specification-url": "https://github.com/y_project/RuoYi-Cloud",
    "category": "microservice",
    "implementation-file": "",
    "tags": "gateway,spring-cloud",
    "action": "create"
  }'

# ========== Step 3: 创建需求并关联组件 ==========
for i in 1 2 3 4; do
  curl -X POST http://localhost:8080/basil/api/mapping/api/sw-requirements \
    -H "Content-Type: application/json" \
    -d '{
      "token": "<token>",
      "user-id": 1,
      "api-id": 1,
      "section": "'$i'",
      "offset": "0",
      "coverage": "0",
      "sw-requirement": { ... }
    }'
done

# ========== Step 4: 链接需求到代码节点 ==========
curl -X POST http://localhost:8080/graph/api/link-requirement \
  -H "Content-Type: application/json" \
  -d '{
    "requirement_id": "1",
    "requirement_title": "REQ-001: XSS 安全过滤",
    "node_id": "/validation-project/.../XssFilter.java:76",
    "description": "XssFilter.getBody 请求体XSS过滤"
  }'

# ========== Step 5: 影响分析 ==========
curl -X POST http://localhost:8080/graph/api/impact \
  -H "Content-Type: application/json" \
  -d '{
    "node_id": "/validation-project/.../XssFilter.java:76",
    "max_depth": 3,
    "direction": "both"
  }'

# ========== Step 6: 查询需求波及节点 ==========
curl http://localhost:8080/graph/api/affected-nodes/1

# ========== Step 7: 图统计 ==========
curl http://localhost:8080/graph/api/stats
```

---

## 二、创建的验证数据

### 软件组件

| ID | 名称 | 库 | 版本 |
|----|------|-----|------|
| 1 | RuoYi-Cloud Gateway | RuoYi-Cloud | 3.8.7 |

### 需求清单

| BASIL ID | 标识 | 标题 | 优先级 | 链接代码节点 |
|----------|------|------|--------|-------------|
| 1 | REQ-001 | XSS 安全过滤 | HIGH | XssFilter.getBody, XssFilter.getHeaders |
| 2 | REQ-002 | JWT Token 认证 | HIGH | AuthFilter |
| 3 | REQ-003 | 用户登录验证码 | MEDIUM | ValidateCodeFilter |
| 4 | REQ-004 | 数据字典缓存 | LOW | SysDictDataService |

### 代码图统计

| 指标 | 值 |
|------|-----|
| 节点总数 | 3,525 |
| 边总数 | 4,148 |
| 图密度 | 0.00033 |
| 社区数 | 58 |
| 语言覆盖 | Java(2393) + JavaScript(486) + YAML(266) + JSON(68) + Markdown(19) + 其他 |
| Top 节点 | `push` (函数, pagerank=0.033), `mergeRecursive` (0.011), `getHeaders` (0.008) |

---

## 三、影响分析报告

### 场景 1: XSS 安全过滤变更

**触发点**: 修改 `XssFilter.getBody()` — 网关请求体 XSS 过滤核心方法

#### 影响概览

```
受影响节点: 25  |  最大深度: 3  |  遍历方向: 双向
```

#### 依赖传播链

```
Depth 0  getBody (method, pagerank=0.0044)
  │
  ├── Depth 1 ─────────────────────────────────────────
  │  ├── JwtUtils.parseToken           (调用 getBody)
  │  ├── ValidateCodeFilter.resolveBodyFromRequest (调用 getBody)
  │  └── XssFilter.requestDecorator   (定义 getBody)
  │
  ├── Depth 2 ─────────────────────────────────────────
  │  ├── JwtUtils (class)              ← JWT 工具类
  │  ├── ValidateCodeFilter (class)    ← 验证码过滤器
  │  ├── XssFilter.getHeaders          ← 请求头过滤
  │  └── XssFilter (class)             ← 过滤器类本身
  │
  └── Depth 3 ─────────────────────────────────────────
     ├── JwtUtils.* 方法集 (createToken, getUserKey, getUserId, ...)
     ├── ValidateCodeFilter.apply       ← 验证码执行
     ├── ServletUtils.webFluxResponseWriter
     ├── FeignRequestInterceptor.apply  ← Feign 拦截器
     ├── AuthFilter.getToken            ← 认证过滤器
     └── XssFilter.filter, getOrder, isJsonRequest
```

#### 关键路径

```
路径 1: getBody → requestDecorator → getHeaders
路径 2: getBody → requestDecorator → getHeaders → FeignRequestInterceptor.apply
路径 3: getBody → ValidateCodeFilter.resolveBodyFromRequest → ValidateCodeFilter
路径 4: getBody → JwtUtils.parseToken → JwtUtils → JwtUtils.* 全部方法
```

#### 开发影响评估

| 影响区域 | 风险等级 | 说明 |
|----------|---------|------|
| XssFilter 内部 | 🔴 高 | filter(), getHeaders(), isJsonRequest() 全部关联 |
| JWT 认证模块 | 🟡 中 | parseToken 直接调用 getBody，波及所有 JwtUtils 方法 |
| 验证码过滤 | 🟡 中 | ValidateCodeFilter 通过 resolveBodyFromRequest 关联 |
| Feign 拦截器 | 🟢 低 | 通过 getHeaders 间接关联 |
| 公用工具类 | 🟢 低 | ServletUtils 通过 webFluxResponseWriter 关联 |

---

### 场景 2: JWT Token 认证变更

**触发点**: 修改 `AuthFilter` — 网关 JWT Token 认证过滤器模块

#### 影响概览

```
受影响节点: 45  |  最大深度: 3  |  遍历方向: 双向
```

#### 依赖传播链

```
Depth 0  AuthFilter (module, pagerank=0.0004)
  │
  ├── Depth 1 ─────────────────────────────────────────
  │  ├── AuthFilter (class)            ← 认证过滤器类
  │  ├── SecurityUtils (module)        ← 安全工具类
  │  └── filter/ (directory)          ← 过滤器目录
  │
  ├── Depth 2 ─────────────────────────────────────────
  │  ├── AuthFilter.filter             ← 认证主逻辑
  │  ├── SecurityUtils.* 方法集
  │  ├── XssFilter (module)            ← XSS 过滤器也被关联
  │  └── ValidateCodeFilter (module)   ← 验证码过滤器也受影响
  │
  └── Depth 3 → 波及 7+ 个模块的 controllers/services
```

#### 开发影响评估

| 影响区域 | 受影响节点数 | 风险等级 |
|----------|------------|---------|
| 网关过滤器链 | ~12 | 🔴 高 |
| ruoyi-common-security | ~8 | 🔴 高 |
| ruoyi-system 模块 | ~10 | 🟡 中 |
| ruoyi-common-core | ~6 | 🟡 中 |
| ruoyi-modules 其他 | ~9 | 🟢 低 |

---

## 四、AI 辅助开发决策

基于影响分析结果，系统可以回答以下问题：

### Q1: 修改 XSS 过滤逻辑还需要改什么？

```
影响路径: XssFilter.getBody
  → 需要同步更新 getHeaders (请求头过滤)
  → 需要检查 JwtUtils.parseToken 调用方
  → 需要验证 ValidateCodeFilter 的请求体解析
  → 需要测试 Feign 请求拦截器的 Header 透传
```

### Q2: 修改认证逻辑会影响哪些模块？

```
影响路径: AuthFilter
  → 网关层: filter chain 全部过滤器
  → 安全层: SecurityUtils 全部方法
  → 业务层: 所有依赖 SecurityUtils 的 controller
```

### Q3: 新增一个网关过滤器需要考虑什么？

```
基于图结构分析:
  → 需要实现 Ordered 接口 (getOrder 控制顺序)
  → 需要注册到 Spring 过滤器链
  → 可能影响 XssFilter/ValidateCodeFilter/AuthFilter 的执行顺序
  → 建议 max_depth=2 分析最佳插入位置
```

---

## 五、结论

| 验证项 | 状态 | 说明 |
|--------|------|------|
| BASIL 需求创建 & 管理 | ✅ | SwRequirement CRUD 正常 |
| BASIL 软件组件管理 | ✅ | Api/Component 注册正常 |
| Graph Engine 代码解析 | ✅ | 3525 节点 / 4148 边 / 8 种语言 |
| 需求 ↔ 代码链接 | ✅ | link-requirement API 正常 |
| BFS 影响分析 | ✅ | 精确计算 blast radius + 关键路径 |
| 端到端流程连通性 | ✅ | 登录 → 组件 → 需求 → 链接 → 分析 |
| 跨模块依赖发现 | ✅ | XSS 修改波及 JWT、Feign、验证码 |

---

## 附: 原始数据

- [图统计快照](graph-stats.json)
- [REQ-001 受影响节点](affected-req001-xss.json) (78 KB)
- [XssFilter 变更影响分析](impact-req001-xss.json) (28 KB)
- [AuthFilter 变更影响分析](impact-req002-jwt.json) (74 KB)
