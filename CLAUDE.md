# CLAUDE.md

本文件为 Claude Code 提供本仓库的上下文，便于后续协作时快速进入状态。

## 项目用途

个人账号 / 凭据管理工具，对一台 MySQL 实例上的若干张表做新增、查看、修改、删除。
仅面向本地或内网使用，**不做鉴权**，**密码明文显示**。

## 技术栈

- **后端**: Go 1.25+，Gin + GORM + MySQL 驱动；通过 `.env`（godotenv）加载配置
- **前端**: React 19 + Vite + TypeScript + Tailwind CSS v4 + react-router-dom + axios + lucide-react
- **风格**: 卡片式现代极简（浅色为主，深色模式自动跟随系统），桌面 + 移动响应式
- **部署**: 单二进制 —— `//go:embed all:frontend/dist` 把前端产物打入 Go binary

## 目录结构

```
account-vault/
├── main.go                            入口；含 //go:embed all:frontend/dist，把 FS 注入 router
├── go.mod / go.sum
├── .env / .env.example
├── internal/
│   ├── config/                        .env 加载
│   ├── db/                            GORM 初始化
│   ├── model/models.go                所有表的 GORM model
│   ├── handler/
│   │   ├── crud.go                    泛型 CRUD（自增 id 表通用）
│   │   └── middleware_account.go      复合主键表独立 handler
│   ├── router/router.go               路由注册 + CORS + 表元信息 + SPA 回退
│   └── web/handler.go                 SPA Gin handler，接收 fs.FS，未命中文件回退 index.html
└── frontend/
    ├── dist/                          vite 构建产物，被根 main.go embed（仅 .gitkeep 入库）
    └── src/
        ├── App.tsx                    路由
        ├── api.ts                     axios 实例（baseURL=/api）
        ├── tables.ts                  各表的展示/字段配置（前端唯一需要改的地方）
        ├── components/
        │   ├── Layout.tsx             桌面侧栏 + 移动顶栏 + 底部 tab
        │   ├── TableView.tsx          通用列表/搜索/增删改
        │   ├── RecordCard.tsx         单条卡片（带逐字段复制）
        │   ├── RecordForm.tsx         新增/编辑表单
        │   └── Modal.tsx              底部弹起的 Sheet 风 Modal
        └── index.css                  Tailwind + 全局样式
```

## 表与主键

| Key | 表 | 主键 | API path |
| --- | --- | --- | --- |
| `apple` | `tb_apple` | 自增 `id` | `/api/apple` |
| `openai` | `tb_openai` | 自增 `id` | `/api/openai` |
| `idc_flare` | `tb_idc_flare` | 自增 `id` | `/api/idc-flare` |
| `linux_do` | `tb_linux_do` | 自增 `id` | `/api/linux-do` |
| `network` | `tb_network` | 自增 `id` | `/api/network` |
| `soft_account` | `tb_soft_account` | 自增 `id` | `/api/soft-account` |
| `middleware_account` | `tb_middleware_account` | **复合键** `public_ip + port + type` | `/api/middleware-account` |

`middleware_account` 无自增 id：
- `PUT` 请求 body 用 `{ _orig_public_ip, _orig_port, _orig_type, data: {...} }` 定位旧记录
- `DELETE` 用 query 参数 `?public_ip=&port=&type=` 定位

## 增加一张新表的流程

1. 在 `internal/model/models.go` 增加新的 struct 和 `TableName()`
2. 在 `internal/router/router.go`：
   - `Tables` 切片加一行元信息
   - 注册 `handler.NewCRUD[NewModel](db).Register(api, "/new-path")`
3. 在 `frontend/src/tables.ts` 的 `tables` 数组添加一项配置（key/label/path/fields/titleKeys/subtitleKeys/hasId）

前端导航和卡片渲染会自动适配——无需改 React 组件。

## 开发

```sh
# 后端（端口默认 :8080，可在 .env 改）
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
- 不要把密码字段做遮蔽——这是产品决策，需求方明确要明文显示
- 不要加登录鉴权——仅内网使用
- 卡片右上角的操作按钮在桌面 hover 时显示，移动端常驻
- Tailwind 用的是 v4（`@import "tailwindcss";`），没有 `tailwind.config.js`，配置通过 CSS 变量即可
