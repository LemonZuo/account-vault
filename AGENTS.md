# AGENTS.md

## Response Language

除非用户另有明确要求，请用中文回答。

## Project Context

Account Vault 是一个个人数据管理工具，用于对一台 MySQL 实例上的若干数据表做新增、查看、修改和删除。默认运行在可信网络环境；如果要公网暴露，应在外层增加访问控制。

## Stack

- 后端：Go 1.25+，Gin，GORM，MySQL driver，godotenv。
- 前端：React 19，Vite，TypeScript，Tailwind CSS v4，react-router-dom，axios，lucide-react。
- 部署：单二进制。`main.go` 使用 `//go:embed all:frontend/dist` 将前端构建产物嵌入 Go binary。
- 样式方向：卡片式现代极简，浅色为主，深色模式跟随系统，桌面和移动端响应式。

## Important Paths

- `main.go`：程序入口，加载配置、初始化日志和数据库，挂载路由。
- `internal/config/`：环境变量、DSN、监听地址配置。
- `internal/db/`：GORM 初始化。
- `internal/logx/`：统一日志和 GORM logger 桥接。
- `internal/model/`：数据表模型定义。
- `internal/handler/crud.go`：通用 CRUD handler。
- `internal/router/router.go`：API 路由、表元信息、SPA fallback。
- `internal/web/handler.go`：嵌入式前端静态文件和 React Router fallback。
- `frontend/src/tables.ts`：前端表定义、字段、展示配置。
- `frontend/src/components/`：前端主要 UI 组件。

需要调整数据结构或表展示时，以 `internal/model/`、`internal/router/`、`internal/handler/` 和 `frontend/src/tables.ts` 的实际代码为准。

## Development Commands

后端开发：

```sh
export PATH=/opt/module/go/go1.25.0/bin:$PATH
cp .env.example .env
go run .
```

前端开发：

```sh
cd frontend
npm install
npm run dev
```

开发态前端使用 Vite dev server，默认 `http://localhost:5173`，`/api` 代理到后端默认端口 `8080`。后端 SPA handler 在 `frontend/dist` 未构建时只返回占位页，所以调试 UI 时使用 Vite。

## Build

```sh
cd frontend
npm install
npm run build

cd ..
export PATH=/opt/module/go/go1.25.0/bin:$PATH
PKG=github.com/LemonZuo/account-vault/internal/buildinfo
go build -ldflags="-s -w -X ${PKG}.Version=$(git describe --tags --always) -X ${PKG}.Commit=$(git rev-parse --short HEAD)" -o bin/server .
```

`npm run build` 会补回 `frontend/dist/.gitkeep`，避免 fresh clone 时 `//go:embed` 因目录为空失败。CI 会注入 `BuildID`；本地构建不注入时默认值为 `dev / unknown / none`。

## Tests And Checks

```sh
export PATH=/opt/module/go/go1.25.0/bin:$PATH
go test ./internal/...

cd frontend
npm run lint
npm run build
```

当前后端测试重点覆盖 `internal/logx` 和 `internal/config`。CRUD handler 没有引入测试数据库。

## Coding Notes

- 不要在公开文档中直接列出具体数据结构或真实敏感数据。
- 日志统一使用 `internal/logx`；日志级别由 `LOG_LEVEL` 控制。
- GORM 错误和慢 SQL 通过 `logx.NewGormLogger` 分级输出。
- Tailwind 使用 v4，入口是 `@import "tailwindcss";`，没有 `tailwind.config.js`。
- 前端改动应延续现有组件、Radix UI、lucide-react 和响应式风格。
- 卡片右上角操作按钮在桌面 hover 时显示，移动端常驻。
- `.githooks/pre-commit` 是本地钩子目录；每个 clone 可用 `git config core.hooksPath .githooks` 启用。

## Git Hygiene

- 可能存在用户未提交改动；改文件前先查看 `git status --short`。
- 不要回退或覆盖用户改动，除非用户明确要求。
- 保持改动范围贴近任务，不做无关重构。
