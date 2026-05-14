# CLAUDE.md

本文件为 Claude Code 提供本仓库的上下文，便于后续协作时快速进入状态。

## 项目用途

个人数据管理工具，对一台 MySQL 实例上的若干数据表做新增、查看、修改、删除。
默认面向可信网络环境；如需公网暴露，应在外层增加访问控制。

## 技术栈

- **后端**: Go 1.25+，Gin + GORM + MySQL 驱动；通过 `.env`（godotenv）加载配置
- **前端**: React 19 + Vite + TypeScript + Tailwind CSS v4 + react-router-dom + axios + lucide-react
- **风格**: 卡片式现代极简（浅色为主，深色模式自动跟随系统），桌面 + 移动响应式
- **部署**: 单二进制 —— `//go:embed all:frontend/dist` 把前端产物打入 Go binary

## 目录结构

```
account-vault/
├── main.go
├── go.mod / go.sum
├── .env / .env.example
├── internal/
│   ├── config/
│   ├── db/
│   ├── model/
│   ├── handler/
│   ├── router/
│   └── web/
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
# 后端（端口默认 8080，可在 .env 的 SERVER_PORT 改）
export PATH=/opt/module/go/go1.25.0/bin:$PATH
cp .env.example .env   # 填好 MySQL 连接
go run .

# 前端（端口默认 :5173；Vite 已把 /api 代理到 :8080）
cd frontend && npm install && npm run dev
```

开发态前端走 Vite dev server，后端 SPA handler 在 `frontend/dist` 为空时只返回占位页 —— 调试 UI 始终用 :5173。

## 打包（单二进制部署）

`main.go` 顶部的 `//go:embed all:frontend/dist` 把 vite 产物嵌入 Go 二进制，`router.NoRoute` 把非 `/api/*` 的请求交给 SPA handler，未命中文件时回退 `index.html` 给 React Router。

```sh
# 1. 前端构建（输出到 frontend/dist，vite 默认位置）
cd frontend && npm install && npm run build

# 2. 后端构建（embed 进 bin/server，单文件分发）
cd ..
export PATH=/opt/module/go/go1.25.0/bin:$PATH
go build -o bin/server .

# 运行
./bin/server   # 同时提供 /api 和 / （前端）
```

`npm run build` 末尾会自动补回 `frontend/dist/.gitkeep`（vite `emptyOutDir` 会清掉），保证下次 fresh clone 时 `//go:embed` 不至于因目录为空报错。

## 注意事项

- go.mod 要求 Go ≥ 1.25，开发用 `/opt/module/go/go1.25.0`
- 不要在公开文档中直接列出具体数据结构
- 默认按可信网络环境使用；公网部署时应在外层增加访问控制
- 卡片右上角的操作按钮在桌面 hover 时显示，移动端常驻
- Tailwind 用的是 v4（`@import "tailwindcss";`），没有 `tailwind.config.js`，配置通过 CSS 变量即可
