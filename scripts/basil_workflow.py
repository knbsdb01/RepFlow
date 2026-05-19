"""BASIL + Graph Engine workflow demo script.
Creates software components, requirements, links them to code graph, runs impact analysis.
"""
import json
import sys
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8080"
TOKEN = "22a88d60-e0d5-4494-aa07-2b464b6350a8"
USER_ID = 1

def api_call(method, path, data=None):
    url = f"{BASE_URL}{path}"
    if method == "GET" and data:
        qs = "&".join(f"{k}={urllib.request.quote(str(v))}" for k,v in data.items())
        url = f"{url}?{qs}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    if data and method != "GET":
        req.data = json.dumps(data).encode()
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ERROR {e.code}: {body[:300]}")
        return None

def create_api(name, library, version, tags=""):
    """Create a software component in BASIL"""
    print(f"\n=== Creating Software Component: {name} ===")
    data = {
        "token": TOKEN,
        "user-id": str(USER_ID),
        "api": name,
        "library": library,
        "library-version": version,
        "raw-specification-url": "https://github.com/y_project/RuoYi-Cloud",
        "category": "microservice",
        "implementation-file": "",
        "tags": tags,
        "action": "create",
    }
    result = api_call("POST", "/basil/api/apis", data)
    if result:
        print(f"  Created: {result.get('data', result)[:200] if isinstance(result.get('data'), str) else result}")
    return result

def create_requirement(title, description, priority="MEDIUM", status="OPEN"):
    """Create a SwRequirement"""
    print(f"\n=== Creating Requirement: {title} ===")
    data = {
        "token": TOKEN,
        "user-id": str(USER_ID),
        "sw-requirement": title,
        "description": description,
        "priority": priority,
        "status": status,
    }
    result = api_call("POST", "/basil/api/sw-requirements", data)
    return result

def list_apis():
    """List existing software components"""
    result = api_call("GET", "/basil/api/apis", {
        "token": TOKEN, "user-id": str(USER_ID),
        "page": "1", "per_page": "40"
    })
    return result

def list_requirements():
    """List existing requirements"""
    result = api_call("GET", "/basil/api/sw-requirements", {
        "token": TOKEN, "user-id": str(USER_ID),
        "page": "1", "per_page": "40"
    })
    return result

# 1. List existing data
print("=" * 60)
print("REQFLOW WORKFLOW DEMO")
print("=" * 60)

print("\n--- Existing APIs ---")
apis = list_apis()
if apis:
    print(json.dumps(apis, indent=2, ensure_ascii=False)[:2000])

print("\n--- Existing Requirements ---")
reqs = list_requirements()
if reqs:
    print(json.dumps(reqs, indent=2, ensure_ascii=False)[:2000])

# 2. Create software components for RuoYi-Cloud modules
APIS_TO_CREATE = [
    ("RuoYi-Cloud Gateway", "RuoYi-Cloud", "3.8.7", "gateway,spring-cloud"),
    ("RuoYi-System Module", "RuoYi-Cloud", "3.8.7", "system,spring-boot"),
    ("RuoYi-Gen Module", "RuoYi-Cloud", "3.8.7", "codegen,spring-boot"),
]

api_ids = {}
for name, lib, ver, tags in APIS_TO_CREATE:
    result = create_api(name, lib, ver, tags)
    if result and "data" in result:
        api_ids[name] = result["data"]

# 3. Create requirements
REQUIREMENTS = [
    {
        "title": "REQ-001: XSS 安全过滤",
        "description": "网关层需要对所有HTTP请求进行XSS过滤，防止跨站脚本攻击。过滤规则包括：HTML标签转义、JavaScript关键字检测、SQL注入关键字检测。",
        "priority": "HIGH",
    },
    {
        "title": "REQ-002: JWT Token 认证",
        "description": "所有API请求必须携带有效的JWT Token，认证通过后才能访问受保护资源。Token需要支持刷新机制，过期时间可配置。",
        "priority": "HIGH",
    },
    {
        "title": "REQ-003: 用户登录验证码",
        "description": "用户登录时需要输入验证码，验证码为4位数字+字母组合，有效期5分钟。连续失败5次后锁定账号15分钟。",
        "priority": "MEDIUM",
    },
    {
        "title": "REQ-004: 数据字典缓存",
        "description": "系统数据字典需要缓存到Redis中，减少数据库查询。当字典数据变更时自动刷新缓存。",
        "priority": "LOW",
    },
]

req_ids = {}
for r in REQUIREMENTS:
    result = create_requirement(r["title"], r["description"], r["priority"])
    req_ids[r["title"]] = result.get("data", {}).get("id") if result else None

print("\n\n=== Created Requirement IDs ===")
for title, rid in req_ids.items():
    print(f"  {title}: id={rid}")

# 4. Link requirements to code nodes via Graph Engine
print("\n\n=== Linking Requirements to Code Nodes ===")

LINK_MAP = [
    ("REQ-001: XSS 安全过滤",
     "/validation-project/ruoyi-gateway/src/main/java/com/ruoyi/gateway/filter/XssFilter.java:76",
     "XssFilter.getBody 方法实现请求体XSS过滤"),
    ("REQ-001: XSS 安全过滤",
     "/validation-project/ruoyi-gateway/src/main/java/com/ruoyi/gateway/filter/XssFilter.java:98",
     "XssFilter.getHeaders 方法实现请求头XSS过滤"),
    ("REQ-002: JWT Token 认证",
     "/validation-project/ruoyi-gateway/src/main/java/com/ruoyi/gateway/filter/AuthFilter.java:0",
     "AuthFilter 过滤器实现Token认证"),
    ("REQ-002: JWT Token 认证",
     "/validation-project/ruoyi-gateway/src/main/java/com/ruoyi/gateway/config/TokenRelayConfig.java:0",
     "TokenRelayConfig Token转发配置"),
    ("REQ-003: 用户登录验证码",
     "/validation-project/ruoyi-gateway/src/main/java/com/ruoyi/gateway/filter/ValidateCodeFilter.java:0",
     "ValidateCodeFilter 验证码过滤器"),
    ("REQ-003: 用户登录验证码",
     "/validation-project/ruoyi-ui/src/components/VerifyCode.vue:0",
     "VerifyCode 前端验证码组件"),
    ("REQ-004: 数据字典缓存",
     "/validation-project/ruoyi-modules/ruoyi-system/src/main/java/com/ruoyi/system/service/SysDictDataServiceImpl.java:0",
     "SysDictDataService 字典数据服务"),
]

for req_title, node_id, description in LINK_MAP:
    link_data = {
        "requirement_id": req_title,
        "requirement_title": req_title,
        "node_id": node_id,
        "description": description,
    }
    result = api_call("POST", "/graph/api/link-requirement", link_data)
    if result:
        print(f"  Linked: {req_title} -> {node_id.split('/')[-1]}")
    else:
        print(f"  FAILED: {req_title} -> {node_id}")

# 5. Run impact analysis
print("\n\n=== Impact Analysis ===")

IMPACT_TARGETS = [
    ("REQ-001: XSS 安全过滤",
     "/validation-project/ruoyi-gateway/src/main/java/com/ruoyi/gateway/filter/XssFilter.java:76"),
]

for req_title, start_node in IMPACT_TARGETS:
    print(f"\n--- Impact: {req_title} ---")
    impact_data = {
        "node_id": start_node,
        "max_depth": 3,
        "direction": "both",
    }
    result = api_call("POST", "/graph/api/impact", impact_data)
    if result:
        print(f"  Result: {json.dumps(result, indent=2, ensure_ascii=False)[:3000]}")

# 6. Get affected nodes for a requirement
print("\n\n=== Affected Nodes by Requirement ===")
for req_title, _, _ in LINK_MAP[:2]:
    result = api_call("GET", f"/graph/api/affected-nodes/{req_title}")
    if result:
        print(f"\n{req_title}:")
        print(f"  {json.dumps(result, indent=2, ensure_ascii=False)[:1000]}")

print("\n\n=== Workflow Demo Complete ===")
