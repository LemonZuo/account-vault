# Account Vault

一套个人数据管理工具，Go (Gin + GORM) 后端 + React (Vite + TS + Tailwind v4) 前端，
卡片式现代极简风格，桌面端和移动端均自适应。

## 目录

```
account-vault/
├── main.go
├── go.mod / go.sum
├── .env / .env.example
├── internal/{config,db,handler,model,router,web}
└── frontend/
    ├── dist/
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

后端提供前端所需的数据读写能力。具体数据细节以代码与实际部署配置为准，README 不展开。

## 设计要点

- **部署边界**：默认面向可信网络环境；如需公网暴露，应在外层增加访问控制。
- **响应式**：≥640px 显示左侧固定导航；移动端顶栏 + 底部横向滚动 tab。
- **新增/编辑**：底部弹起的卡片式 Modal，移动端体验接近原生 sheet。
