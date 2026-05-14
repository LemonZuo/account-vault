# Account Vault

一套个人账号 / 凭据管理工具，Go (Gin + GORM) 后端 + React (Vite + TS + Tailwind v4) 前端，
卡片式现代极简风格，桌面端和移动端均自适应。

## 表

后端会直接连接你提供的 MySQL 数据库，对以下 7 张表做 CRUD：

| 表名 | 说明 | 主键 |
| --- | --- | --- |
| `tb_apple` | Apple 账号 | 自增 id |
| `tb_openai` | OpenAI 账号 | 自增 id |
| `tb_idc_flare` | IDC Flare | 自增 id |
| `tb_linux_do` | Linux.do | 自增 id |
| `tb_network` | 宽带账户 | 自增 id |
| `tb_soft_account` | 软件账号 | 自增 id |
| `tb_middleware_account` | 中间件账号 | 复合键 `public_ip + port + type` |

## 目录

```
account-vault/
├── main.go                            Go 入口；//go:embed all:frontend/dist
├── go.mod / go.sum
├── .env / .env.example
├── internal/{config,db,handler,model,router,web}
└── frontend/                          React 前端
    ├── dist/                          vite 产物，被根 main.go embed
    └── src/{App.tsx, components, tables.ts, api.ts}
```

## 后端启动

1. 拷贝并填写环境变量：
   ```sh
   cp .env.example .env
   # 编辑 .env 填上 DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
   ```

2. 选用本地的 Go（多版本目录 `/opt/module/go`，需要 ≥ 1.25）：
   ```sh
   export PATH=/opt/module/go/go1.25.0/bin:$PATH
   go run .
   # 或者构建后运行
   go build -o bin/server . && ./bin/server
   ```

   服务默认监听 `http://0.0.0.0:8080`，可在 `.env` 中改 `SERVER_PORT`。

## 前端启动

```sh
cd frontend
npm install      # 已安装可跳过
npm run dev      # 开发模式，默认 http://localhost:5173
npm run build    # 生产构建到 dist/，被 //go:embed 打入后端二进制
```

Vite 已配置 `/api` 代理到 `http://localhost:8080`，开发环境无需另开 CORS。

## 单二进制发布

```sh
cd frontend && npm run build && cd ..
go build -o bin/server .
./bin/server   # 同时提供 /api 和 / （前端 SPA）
```

## API

- `GET    /api/{path}`         列表
- `POST   /api/{path}`         新增（提交字段见各表 model）
- `PUT    /api/{path}/:id`     按 id 更新（自增 id 表）
- `DELETE /api/{path}/:id`     按 id 删除（自增 id 表）

`middleware-account` 表无 id，特殊接口：

- `GET    /api/middleware-account`
- `POST   /api/middleware-account`
- `PUT    /api/middleware-account`  body: `{ _orig_public_ip, _orig_port, _orig_type, data: {...} }`
- `DELETE /api/middleware-account?public_ip=&port=&type=`

`GET /api/tables` 会返回所有可用表的元数据，前端可用作动态导航。

## 设计要点

- **无鉴权**：仅本地/内网使用，前端直连 8080。
- **密码明文显示**：按需求未做遮蔽，列表卡片上每个字段右侧带一键复制按钮。
- **响应式**：≥640px 显示左侧固定导航；移动端顶栏 + 底部横向滚动 tab。
- **新增/编辑**：底部弹起的卡片式 Modal，移动端体验接近原生 sheet。
