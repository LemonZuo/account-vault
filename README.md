# Account Vault

一套个人数据管理工具，Go (Gin + GORM) 后端 + React (Vite + TS + Tailwind v4) 前端，
卡片式现代极简风格，桌面端和移动端均自适应。

## 目录

```
account-vault/
├── main.go
├── go.mod / go.sum
├── .env / .env.example
├── cliff.toml
├── internal/{buildinfo,config,db,handler,logx,model,router,web}
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

   服务默认监听 `http://0.0.0.0:8080`，可在 `.env` 中改 `SERVER_PORT`；日志级别由 `LOG_LEVEL`（debug/info/warn/error）控制。

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
`GET /api/version` 返回 `version` / `commit` / `build_id`（ldflags 注入，默认 `dev` / `unknown` / `none`）。

## Docker

仓库里的 `docker-compose.yml` 包含两个服务：

- `account-vault`：业务本体，监听 `8080`。配置走 `.env`（只读挂载到容器 `/app/.env`），`godotenv.Load()` 会自动读到。
- `tinyauth`：前置登录网关，监听 `3000`。account-vault 不内置鉴权，公网入口建议挂在反代后面、由 tinyauth 做登录拦截，再回源到 account-vault。配置直接写在 compose 里，不读 `.env`。

1. 准备 account-vault 配置：

```sh
cp .env.example .env
# 编辑 .env 填上 DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME 等
```

注意：容器里的 `127.0.0.1` 指向容器自己。如果 MySQL 跑在宿主机或其他机器上，`DB_HOST` 应填写宿主机可被容器访问的地址、局域网 IP、Docker 网络里的服务名，或你自己的数据库地址。

2. 配置 tinyauth：直接编辑 `docker-compose.yml` 中 `tinyauth.environment` 三个占位值：

- `SECRET`：32 字节随机串，例如 `openssl rand -hex 16`。
- `USERS`：`user:bcrypt-hash` 形式。可用下面的 docker 命令生成：

  ```sh
  docker run --rm httpd:alpine htpasswd -nbB admin '你的密码'
  ```

  把输出原样填进 `USERS`，**每个 `$` 都改写成 `$$`**——compose 会把 `$xxx` 当变量插值，双写后才是字面 `$`，容器内仍是单 `$`。

- `APP_URL`：tinyauth 自身对外访问入口（反代后通常是 `https://auth.example.com`），用于登录回跳。

3. 启动服务：

```sh
mkdir -p data/tinyauth
docker compose pull
docker compose up -d
```

启动后访问：

```text
http://localhost:8080   # account-vault（直接访问，绕开鉴权）
http://localhost:3000   # tinyauth 登录页
```

公网部署时应由反代仅暴露 tinyauth，account-vault 端口收回内网，由反代鉴权通过后回源到 account-vault 容器。

4. 查看状态和日志：

```sh
docker compose ps
docker compose logs -f account-vault
docker compose logs -f tinyauth
```

5. 更新镜像：

```sh
docker compose pull
docker compose up -d
```

持久化卷：

| 宿主机路径 | 容器路径 | 用途 |
| --- | --- | --- |
| `./.env` | `/app/.env` | account-vault 应用配置，只读挂载 |
| `./data/tinyauth` | `/data` | tinyauth 用户会话等持久化数据 |

## Nginx 反向代理

下面是把 account-vault 和 tinyauth 放在 nginx 后面、用 tinyauth 拦截 account-vault 入口的最小模板。两个域名各一个 server 块，account-vault 这块通过 `auth_request` 调 tinyauth 的鉴权接口，401 时重定向到 tinyauth 登录页。SSL 证书路径、上游端口（与 compose 一致：account-vault `8080` / tinyauth `3000`）按实际改。

```nginx
# 1. tinyauth 登录页本身
server {
    listen 443 ssl;
    server_name auth.example.com;

    ssl_certificate     /etc/nginx/certs/auth.example.com.pem;
    ssl_certificate_key /etc/nginx/certs/auth.example.com.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. account-vault 主入口,经 tinyauth 鉴权后转发
server {
    listen 443 ssl;
    server_name vault.example.com;

    ssl_certificate     /etc/nginx/certs/vault.example.com.pem;
    ssl_certificate_key /etc/nginx/certs/vault.example.com.key;

    location / {
        auth_request /auth;
        error_page 401 = @login;

        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 内部 auth 子请求,转发给 tinyauth
    location = /auth {
        internal;
        proxy_pass http://127.0.0.1:3000/api/auth/nginx;
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_set_header X-Forwarded-Uri   $request_uri;
        proxy_pass_request_body off;
        proxy_set_header Content-Length "";
    }

    # 未登录跳到 tinyauth 登录页,登录成功后回到原 URL
    location @login {
        return 302 https://auth.example.com/login?redirect_uri=$scheme://$host$request_uri;
    }
}
```

> tinyauth 的鉴权 endpoint(示例里写的 `/api/auth/nginx`)和登录回跳参数名以 tinyauth 当前版本文档为准,有差异时按其文档替换即可。
> 启用反代后，宿主机不应把 account-vault 的 `8080` 端口对公网开放，由 nginx 走环回(`127.0.0.1`)单独回源；tinyauth 的 `3000` 同理。

## 测试与钩子

```sh
go test ./internal/...   # logx + config 两块
```

可选启用 pre-commit 门禁（`.githooks/pre-commit`，本地配置不入库）：

```sh
git config core.hooksPath .githooks
```

只对 staged `.go` 文件跑 `gofmt -l` + 全仓 `go vet ./...`。

## 设计要点

- **部署边界**：默认面向可信网络环境；如需公网暴露，应在外层增加访问控制。
- **响应式**：≥640px 显示左侧固定导航；移动端顶栏 + 底部横向滚动 tab。
- **新增/编辑**：底部弹起的卡片式 Modal，移动端体验接近原生 sheet。
- **日志**：统一 `internal/logx`（slog + 可读 handler），gorm 错误/慢 SQL(>300ms) 自动分级到 logx，`LOG_LEVEL=debug` 时打印每条 SQL。
