回到[项目首页](../README.md)

# 开发

本文档面向二次开发与本地调试，记录环境要求、目录结构、配置项与常用命令。生产部署细节见 [deployment.md](./deployment.md)，HTTP 接口见 [api.md](./api.md)。

## 环境要求

| 组件 | 版本 | 说明 |
| --- | --- | --- |
| Go | ≥ 1.25 | `go.mod` 强制约束；本地多版本路径 `/opt/module/go/go1.25.0` |
| Node.js | ≥ 20 | Vite 5 / React 19 推荐版本 |
| MySQL | 5.7 / 8.x | 字符集 `utf8mb4` |
| Docker | 可选 | 仅 Compose 部署时需要 |

## 目录结构

```
account-vault/
├── main.go                       # 入口：加载配置 → 初始化日志/DB → 装配路由 → 监听
├── go.mod / go.sum
├── .env.example                  # 配置模板，复制为 .env 后填写
├── cliff.toml                    # git-cliff 配置，按 conventional commit 分组
├── Dockerfile / docker-compose.yml
├── .github/workflows/release.yml # matrix 构建 + 镜像 + Release
├── .githooks/pre-commit          # 本地钩子（gofmt + go vet），不入库
├── internal/
│   ├── buildinfo/                # Version / Commit / BuildID，ldflags 注入
│   ├── config/                   # .env 加载与 DSN 拼装
│   ├── db/                       # GORM 初始化，logger 走 logx
│   ├── handler/
│   │   ├── crud.go               # 泛型 CRUD[T]，9 张表共用
│   │   └── health.go             # /healthz handler
│   ├── logx/                     # slog 自定义可读 handler + GORM 桥接
│   ├── model/models.go           # 9 张表的 GORM 模型
│   ├── router/router.go          # 路由装配 + 表元信息
│   └── web/handler.go            # 嵌入式静态资源与 SPA fallback
└── frontend/
    ├── dist/                     # vite build 输出，被 //go:embed 嵌入
    └── src/
        ├── App.tsx               # 顶层布局与路由
        ├── api.ts                # axios 封装
        ├── tables.ts             # 表元信息、字段、展示配置
        ├── components/           # 卡片、Modal、表单等通用组件
        └── index.css             # Tailwind v4 入口
```

## 配置（.env）

`.env` 与 `.env.example` 一一对应。所有键均可通过环境变量覆盖；godotenv 仅在工作目录存在 `.env` 时加载，运行环境已注入同名变量时会优先采用环境变量。

| 键 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- |
| `DB_HOST` | 是 | `127.0.0.1` | MySQL 主机；容器内 `127.0.0.1` 指向容器自身 |
| `DB_PORT` | 是 | `3306` | MySQL 端口 |
| `DB_USER` | 是 | `root` | MySQL 账号 |
| `DB_PASSWORD` | 是 | 空 | MySQL 密码 |
| `DB_NAME` | 是 | 空 | 数据库名，需预先建库与表 |
| `DB_CHARSET` | 否 | `utf8mb4` | 连接字符集 |
| `SERVER_PORT` | 否 | `8080` | 后端监听端口；`ListenAddr` 自动补 `:` |
| `LOG_LEVEL` | 否 | `info` | `debug / info / warn / error`；`debug` 时输出每条 SQL |

Docker 层额外使用：

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `IMAGE` | `ghcr.io/lemonzuo/account-vault:latest` | compose 拉取的镜像 |
| `HOST_PORT` | `8080` | 宿主机映射端口 |
| `TZ` | `Asia/Shanghai` | 容器时区 |
| `GIN_MODE` | `release` | `debug / release / test` |

## 启动顺序

`main.go` 串起整个启动流程：

1. `config.Load()`：加载 `.env`，构建 `Config` 结构体，归一化端口；
2. `logx.Init(cfg.LogLevel)`：初始化 slog 自定义可读 handler；
3. 输出 `account-vault starting`，附带 buildinfo（`Version / Commit / BuildID`）；
4. `db.New(cfg)`：通过 GORM 连接 MySQL，logger 替换为 `logx.NewGormLogger`；
5. `fs.Sub(frontendFS, "frontend/dist")`：从 embed 文件系统裁出前端根；
6. `router.Setup(db, dist)`：装配 CORS、`/healthz`、`/api/*` 与 SPA fallback；
7. `r.Run(cfg.ListenAddr())`：阻塞监听。

后端不执行 AutoMigrate；表结构需在 MySQL 中预先创建（见 [deployment.md](./deployment.md#数据库准备)）。

## 本地开发

```sh
# 后端
export PATH=/opt/module/go/go1.25.0/bin:$PATH
cp .env.example .env   # 填上 MySQL 连接
go run .               # 默认监听 :8080

# 前端
cd frontend
npm install            # 已装可省略
npm run dev            # Vite dev server，默认 :5173
```

Vite 已将 `/api` 代理至 `http://localhost:8080`，因此前端开发态直接访问 `http://localhost:5173` 即可。后端 SPA handler 在 `frontend/dist` 为空时仅返回占位页，**调试 UI 始终走 :5173**。

## 常用命令

```sh
# Go 单测（覆盖 logx 与 config 两个包）
go test ./internal/...

# 前端 lint + 构建
cd frontend && npm run lint && npm run build

# 单二进制构建（CI 会注入 buildinfo，本地缺省值为 dev/unknown/none）
cd frontend && npm install && npm run build && cd ..
export PATH=/opt/module/go/go1.25.0/bin:$PATH
PKG=github.com/LemonZuo/account-vault/internal/buildinfo
go build -ldflags="-s -w \
  -X ${PKG}.Version=$(git describe --tags --always) \
  -X ${PKG}.Commit=$(git rev-parse --short HEAD)" \
  -o bin/server .

# 本地 pre-commit 钩子（仅本机生效，钩子文件不入库）
git config core.hooksPath .githooks
```

`npm run build` 末尾会自动补回 `frontend/dist/.gitkeep`，避免 fresh clone 时 `//go:embed` 因目录为空而失败。

## 日志

- 统一使用 `internal/logx`：自定义 slog handler，输出形如 `time level msg key=value`，必要时对值加引号；
- GORM 错误与慢 SQL（> 300ms）通过 `logx.NewGormLogger` 分级输出；
- `LOG_LEVEL=debug` 时打印每条 SQL，便于调试；生产建议 `info`；
- `/healthz` access log 被 Gin `SkipPaths` 主动屏蔽，避免容器探针每 5 分钟打印一行。

## 新增表

> 仅说明流程，不展开具体字段。

1. `internal/model/models.go`：新增结构体、`TableName()`；
2. `internal/router/router.go`：在 `Tables` 切片中追加元信息，并调用 `handler.NewCRUD[model.XXX](db).Register(api, "/x-x-x")`；
3. `frontend/src/tables.ts`：补字段定义与展示配置；
4. MySQL 中预先建好对应 `tb_*` 表。

后端不需要新增 handler 文件，CRUD 由 `internal/handler/crud.go` 的泛型实现统一提供。
