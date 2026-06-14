# CLAUDE.md

本文件为 Claude Code 提供本仓库的上下文，便于后续协作时快速进入状态。

## 项目用途

个人数据管理工具，针对一台 MySQL 实例上的若干数据表提供新增、查看、修改与删除能力。
默认面向可信网络环境；如需公网暴露，应在外层增加访问控制。

## 技术栈

- **后端**：Go 1.25+，Gin + GORM + MySQL 驱动；通过 `.env`（godotenv）加载配置
- **前端**：React 19 + Vite + TypeScript + Tailwind CSS v4 + react-router-dom + axios + lucide-react
- **风格**：卡片式现代极简（以浅色为主，深色模式跟随系统），桌面端与移动端均响应式
- **部署**：单二进制 —— `//go:embed all:frontend/dist` 将前端产物嵌入 Go binary

## 目录结构

```
account-vault/
├── main.go
├── go.mod / go.sum
├── .env / .env.example
├── cliff.toml          # git-cliff 配置，按 conventional commit 前缀分组生成 release notes
├── internal/
│   ├── buildinfo/      # Version / Commit / BuildID（ldflags 注入），/api/version 暴露
│   ├── config/
│   ├── db/             # gorm logger 走 logx.NewGormLogger
│   ├── handler/        # crud.go 通用 CRUD（9 表共用） + health.go（/healthz 探活 DB）
│   ├── logx/           # slog + 自定义可读 handler + GORM 桥接，级别由 LOG_LEVEL 控制
│   ├── model/
│   ├── router/
│   └── web/
├── .github/workflows/  # release.yml：matrix amd64/arm64 → checksums → docker → release(git-cliff)
├── .githooks/          # pre-commit：staged .go 文件 gofmt + go vet（本地启用，见下）
└── frontend/
    ├── dist/
    └── src/
        ├── App.tsx
        ├── api.ts
        ├── tables.ts
        ├── components/
        └── index.css
```

## 数据结构

具体数据细节不在文档中展开。需要调整数据结构时，以 `internal/model/`、`internal/router/`、`internal/handler/` 和 `frontend/src/tables.ts` 的实际代码为准。

## 开发

```sh
# 后端（端口默认 8080，可通过 .env 的 SERVER_PORT 调整）
export PATH=/opt/module/go/go1.25.0/bin:$PATH
cp .env.example .env   # 填写 MySQL 连接信息
go run .

# 前端（端口默认 :5173；Vite 已将 /api 代理至 :8080）
cd frontend && npm install && npm run dev
```

开发态前端使用 Vite dev server；当 `frontend/dist` 为空时，后端 SPA handler 仅返回占位页，因此调试 UI 始终通过 :5173 访问。

## 打包（单二进制部署）

`main.go` 顶部的 `//go:embed all:frontend/dist` 将 vite 产物嵌入 Go 二进制；`router.NoRoute` 将非 `/api/*` 的请求转交 SPA handler，未命中文件时回退至 `index.html` 由 React Router 处理。

```sh
# 1. 前端构建（输出到 frontend/dist，vite 默认位置）
cd frontend && npm install && npm run build

# 2. 后端构建（embed 进 bin/server，单文件分发）
cd ..
export PATH=/opt/module/go/go1.25.0/bin:$PATH
PKG=github.com/LemonZuo/account-vault/internal/buildinfo
go build -ldflags="-s -w -X ${PKG}.Version=$(git describe --tags --always) -X ${PKG}.Commit=$(git rev-parse --short HEAD)" -o bin/server .

# 运行
./bin/server   # 同时提供 /api 与 /（前端）
```

`npm run build` 末尾会自动补回 `frontend/dist/.gitkeep`（vite 的 `emptyOutDir` 会清空目录），确保下次 fresh clone 时 `//go:embed` 不会因目录为空而失败。

CI（`.github/workflows/release.yml`）会自动计算 `BuildID` 并通过 `-X` 注入；本地构建时可省略，默认值为 `dev / unknown / none`。

## 测试

```sh
go test ./internal/...
```

目前覆盖 `internal/logx`（slog handler 格式、级别解析、引号判断、WithAttrs + WithGroup）与 `internal/config`（默认值、env 覆盖、DSN、normalizePort 边界）。CRUD handler 不引入测试 DB，依赖 `logx.NewGormLogger` 将 SQL 错误捕获至日志。

## pre-commit 钩子

`.githooks/pre-commit` 不入库（`.git/info/exclude` 排除），每个 clone 启用一次：

```sh
git config core.hooksPath .githooks
```

钩子仅对 staged `.go` 文件执行 `gofmt -l`，并对全仓执行 `go vet ./...`，任一未通过即阻断提交。

## 注意事项

- go.mod 要求 Go ≥ 1.25，开发使用 `/opt/module/go/go1.25.0`
- 不要在公开文档中直接列出具体数据结构
- 默认按可信网络环境使用；公网部署时应在外层增加访问控制
- 日志统一使用 `internal/logx`（slog 结构化），级别由 `LOG_LEVEL` 控制；gorm 错误与慢 SQL（> 300ms）自动按级别接入 logx
- 健康检查：`GET /healthz` 挂载于根路径（不在 `/api` 之下），2 秒超时内完成 DB ping，失败返回 503；Dockerfile 与 compose 均已配置 HEALTHCHECK（5min interval + 5s start-interval）；router 通过 `LoggerWithConfig{SkipPaths:["/healthz"]}` 跳过探针 access log
- 卡片右上角的操作按钮在桌面端 hover 时显示，移动端常驻
- Tailwind 采用 v4（`@import "tailwindcss";`），不再提供 `tailwind.config.js`，配置通过 CSS 变量完成
