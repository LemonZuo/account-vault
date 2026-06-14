回到[项目首页](../README.md)

# HTTP API

Account Vault 的 HTTP 接口分两类：根路径下的健康探针，以及 `/api/*` 下的数据接口。后端自身不内置鉴权，公网部署应在反代/网关层（如 tinyauth + nginx）处理登录。

## 通用约定

- **前缀**：除 `/healthz` 外，所有接口位于 `/api/*`；
- **数据格式**：请求与响应均为 JSON，UTF-8；
- **CORS**：允许所有 Origin、`GET/POST/PUT/DELETE/OPTIONS` 方法、`Origin/Content-Type/Accept/Authorization` 头；
- **成功响应**：列表与单体接口统一返回 `{"data": ...}`，删除返回 `{"ok": true}`；
- **错误响应**：`{"error": "<message>"}`，HTTP 状态码遵循通常约定（`400` 参数错误、`404` 路由未命中、`500` 服务端/DB 错误、`503` 健康检查降级）；
- **鉴权**：无。后端假设运行在可信网络或反代鉴权之后。

## 健康检查与版本

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/healthz` | 容器探针；2 秒内完成 DB ping。正常 `200 {"status":"ok","db":"ok"}`，DB 异常 `503 {"status":"degraded","db":"<err>"}`。Gin 跳过该路径 access log。 |
| `GET` | `/api/version` | 构建版本。`{"version":"...","commit":"...","build_id":"..."}`，由 ldflags 注入，本地缺省 `dev / unknown / none`。 |

## 表元信息

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/tables` | 返回前端导航所需的表清单。`{"data":[{"key":"apple","label":"Apple 账号","path":"apple"}, ...]}`。`path` 即下文 CRUD 路径段。 |

## 通用 CRUD

9 张表共用 `internal/handler/crud.go` 的泛型实现。每张表暴露完全相同的 4 个端点（`<path>` 为 `/api/tables` 中返回的 path 段）：

| 方法 | 路径 | 行为 |
| --- | --- | --- |
| `GET` | `/api/<path>` | 列表，按 `id ASC` 排序。响应 `{"data": [item, ...]}` |
| `POST` | `/api/<path>` | 新增。请求体为完整记录 JSON（不含 `id`），响应 `{"data": item}`（含数据库生成的 `id`） |
| `PUT` | `/api/<path>/:id` | 全字段更新。请求体为完整记录 JSON，后端使用 `Select("*").Omit("id")` 确保未传字段也被置空 |
| `DELETE` | `/api/<path>/:id` | 按主键删除。响应 `{"ok": true}` |

注意点：

- 列表接口当前不分页、不带服务端搜索；过滤、搜索、排序由前端基于 `tables.ts` 在内存中完成。
- `kw` 查询参数在后端被预留但未启用；如未来需要服务端搜索，按 `internal/handler/crud.go:31` 实现。
- 更新使用结构体全字段覆盖（`Select("*").Omit("id")`）。这意味着**请求体省略的字段会被置零**，前端需提交完整记录。
- 表结构与字段细节请参考 `internal/model/models.go` 与 `frontend/src/tables.ts`，本文不再罗列。

### 当前可用路径

`/api/tables` 返回的 `path` 列表（与 `internal/router/router.go` 一致）：

| Key | Label | Path |
| --- | --- | --- |
| `apple` | Apple 账号 | `apple` |
| `openai` | OpenAI 账号 | `openai` |
| `claude` | Claude 账号 | `claude` |
| `idc_flare` | IDC Flare | `idc-flare` |
| `linux_do` | Linux.do | `linux-do` |
| `network` | 宽带账户 | `network` |
| `soft_account` | 软件账号 | `soft-account` |
| `components_account` | 组件账号 | `components-account` |
| `middleware_account` | 中间件账号 | `middleware-account` |

新增表的流程见 [development.md - 新增表](./development.md#新增表)。

## 示例

> 假设服务监听在 `http://127.0.0.1:8080`，下面以 `apple` 表为例。字段以伪占位代替，**不展示真实结构**。

```sh
# 列表
curl -s http://127.0.0.1:8080/api/apple

# 新增
curl -s -X POST http://127.0.0.1:8080/api/apple \
  -H 'Content-Type: application/json' \
  -d '{"mail":"<...>", "password":"<...>", "remark":"<...>"}'

# 更新（id=1）
curl -s -X PUT http://127.0.0.1:8080/api/apple/1 \
  -H 'Content-Type: application/json' \
  -d '{"mail":"<...>", "password":"<...>", "remark":"<...>"}'

# 删除（id=1）
curl -s -X DELETE http://127.0.0.1:8080/api/apple/1
```

## 前端与 SPA Fallback

未命中 `/api/*` 的请求由 `router.NoRoute` 交给 `internal/web/handler.go` 的 SPA handler 处理：

- 命中 `frontend/dist` 内的静态文件时直接返回；
- 未命中时回退 `index.html`，让 React Router 接管前端路由；
- `frontend/dist` 为空（开发态未构建）时返回占位页，调试 UI 应改用 Vite dev server（`:5173`）。

`/api/*` 未匹配的接口固定返回 `404 {"error": "not found"}`，不会回落到 SPA。
