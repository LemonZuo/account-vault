回到[项目首页](../README.md)

# 部署

Account Vault 设计为单二进制 + 单 MySQL 实例的轻量部署。镜像内含前端产物（由 `//go:embed all:frontend/dist` 注入），运行时只需一份 `.env` 与可达的 MySQL。

## 数据库准备

后端**不执行** AutoMigrate，启动时不会自行建表。请在目标 MySQL 上预先创建数据库与对应表结构：

1. 创建数据库（字符集建议 `utf8mb4`）：

   ```sql
   CREATE DATABASE IF NOT EXISTS account_vault
     DEFAULT CHARSET utf8mb4
     DEFAULT COLLATE utf8mb4_unicode_ci;
   ```

2. 按 `internal/model/models.go` 中各结构体的 `TableName()` 与字段，创建对应的 `tb_*` 表。字段类型以业务需要为准（多数为 `VARCHAR`），主键统一为自增 `id`。

3. 在 `.env` 中将 `DB_NAME` 指向该库，并保证账号具备 `SELECT / INSERT / UPDATE / DELETE` 权限。

未建表时调用对应 CRUD 接口会返回 5xx 并在日志中输出 GORM 错误。

## Docker Compose

仓库提供的 `docker-compose.yml` 包含两个服务：

- `account-vault`：应用本体，监听 `8080`。配置通过 `.env`（只读挂载至容器 `/app/.env`），由 `godotenv.Load()` 自动加载。
- `tinyauth`：前置登录网关，监听 `3000`。account-vault 自身不内置鉴权，公网入口建议部署在反代之后，由 tinyauth 处理登录拦截后再回源至 account-vault。其配置直接写入 compose 文件，不读取 `.env`。

### 1. 准备 account-vault 配置

```sh
cp .env.example .env
# 编辑 .env 填上 DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME 等
```

注意：容器内的 `127.0.0.1` 指向容器自身。若 MySQL 运行在宿主机或其他机器，`DB_HOST` 应填写容器可访问的宿主机地址、局域网 IP、Docker 网络中的服务名或对应的数据库地址。

各配置项含义见 [development.md - 配置（.env）](./development.md#配置env)。

### 2. 配置 tinyauth

编辑 `docker-compose.yml` 中 `tinyauth.environment` 的三个占位值：

- `SECRET`：32 字节随机串，例如 `openssl rand -hex 16`。
- `USERS`：`user:bcrypt-hash` 形式，可使用以下 docker 命令生成：

  ```sh
  docker run --rm httpd:alpine htpasswd -nbB admin '你的密码'
  ```

  将输出填入 `USERS`，并将其中每个 `$` 替换为 `$$`——compose 会对 `$xxx` 做变量插值，双写后表示字面量 `$`，容器内仍为单个 `$`。

- `APP_URL`：tinyauth 自身的对外访问入口（反代后通常为 `https://auth.example.com`），用于登录回跳。

### 3. 启动服务

```sh
mkdir -p data/tinyauth
docker compose pull
docker compose up -d
```

启动后访问：

```text
http://localhost:8080   # account-vault（直接访问，绕过鉴权）
http://localhost:3000   # tinyauth 登录页
```

公网部署时应仅由反代暴露 tinyauth，account-vault 端口不对外开放，反代鉴权通过后回源至 account-vault 容器。

### 4. 查看状态和日志

```sh
docker compose ps
docker compose logs -f account-vault
docker compose logs -f tinyauth
```

### 5. 更新镜像

```sh
docker compose pull
docker compose up -d
```

### 持久化卷

| 宿主机路径 | 容器路径 | 用途 |
| --- | --- | --- |
| `./.env` | `/app/.env` | account-vault 应用配置，只读挂载 |
| `./data/tinyauth` | `/data` | tinyauth 用户会话等持久化数据 |

## 裸机二进制

适用于不便启用 Docker 的环境。前置条件：

- Go ≥ 1.25（仓库 CI 使用 `/opt/module/go/go1.25.0`）；
- Node ≥ 20（用于构建前端，构建产物会被 embed 进二进制）；
- 目标机器可访问目标 MySQL。

构建：

```sh
cd frontend && npm install && npm run build && cd ..
export PATH=/opt/module/go/go1.25.0/bin:$PATH
PKG=github.com/LemonZuo/account-vault/internal/buildinfo
go build -ldflags="-s -w \
  -X ${PKG}.Version=$(git describe --tags --always) \
  -X ${PKG}.Commit=$(git rev-parse --short HEAD)" \
  -o bin/server .
```

运行：

```sh
cp .env.example .env   # 编辑后填上数据库信息
./bin/server
```

`bin/server` 同时提供 `/api/*` 与 `/`（前端 SPA）。可使用 `systemd` 守护，模板示例：

```ini
# /etc/systemd/system/account-vault.service
[Unit]
Description=Account Vault
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/account-vault
ExecStart=/opt/account-vault/bin/server
EnvironmentFile=-/opt/account-vault/.env
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

启用：

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now account-vault
sudo journalctl -u account-vault -f
```

## Nginx 反向代理

公网部署时建议在 nginx 与 tinyauth 之后回源至 account-vault，account-vault 自身的 `8080` 端口不对公网开放。以下是将 account-vault 与 tinyauth 置于 nginx 反代之后、由 tinyauth 鉴权保护 account-vault 入口的最小模板。两个域名各一个 server 块，account-vault 通过 `auth_request` 调用 tinyauth 的鉴权接口，401 时重定向至 tinyauth 登录页。SSL 证书路径与上游端口（与 compose 保持一致：account-vault `8080` / tinyauth `3000`）请按实际部署调整。

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

> tinyauth 的鉴权 endpoint（示例中的 `/api/auth/nginx`）与登录回跳参数名以当前版本官方文档为准，如有差异请按官方文档替换。
> 启用反代后，宿主机不应将 account-vault 的 `8080` 端口对公网开放，由 nginx 通过环回地址（`127.0.0.1`）单独回源；tinyauth 的 `3000` 端口同理。

## 健康检查与版本

| 路径 | 用途 | 返回 |
| --- | --- | --- |
| `GET /healthz` | 容器探针：2 秒内完成 DB ping；不在 `/api` 之下 | 正常 200 `{"status":"ok","db":"ok"}`；DB 异常 503 `{"status":"degraded","db":"<err>"}` |
| `GET /api/version` | 构建版本 | `{"version":"...","commit":"...","build_id":"..."}` |

Gin 路由通过 `LoggerWithConfig{SkipPaths:["/healthz"]}` 跳过探针 access log，避免污染日志。Dockerfile 与 compose 的 HEALTHCHECK 间隔为 `5m`，启动期使用 `start_interval=5s` 缩短首次就绪等待。

## 发布

仓库使用 `.github/workflows/release.yml`，推送形如 `v*` 的 Tag 即触发：

1. matrix 构建 `linux/amd64` 与 `linux/arm64` 二进制，注入 `Version / Commit / BuildID`；
2. 生成 SHA256 校验文件；
3. 构建多架构镜像并推送至 GHCR（`ghcr.io/lemonzuo/account-vault:<tag>` 与 `:latest`）；
4. 由 git-cliff（配置见 `cliff.toml`）从 conventional commit 生成 changelog 并创建 GitHub Release。

Tag 规则：`vMAJOR.MINOR.PATCH`，patch 为单位数（0–9）。`PATCH=9` 时进位到 `MINOR+1`，`PATCH` 归零。例如 `v1.0.9 → v1.1.0`。

## 备份建议

| 对象 | 备份方式 | 频率参考 |
| --- | --- | --- |
| MySQL 数据 | `mysqldump` / 物理备份 / 上游 RDS 快照 | 按业务重要性，至少每日一次 |
| `.env` | 文件备份至离线介质 | 修改时同步 |
| `data/tinyauth/` | 仅会话数据，丢失后用户需重新登录 | 可选 |

应用本身无状态，重建容器只需保留 `.env` 与可访问的 MySQL。

## 故障排查

| 现象 | 排查方向 |
| --- | --- |
| 启动即退出，日志含 `connect db` | `DB_HOST/PORT/USER/PASSWORD/NAME` 是否填写正确；容器内 `127.0.0.1` 指向容器自身，需改为宿主机或服务名 |
| CRUD 接口 500，日志含 `Error 1146 ... doesn't exist` | 目标表未在 MySQL 中预创建，参考"数据库准备"章节 |
| `docker compose ps` 显示 `unhealthy` | 检查 `/healthz` 是否返回 503；常见原因仍是 DB 不可达 |
| 前端页面只看到占位文字 | `frontend/dist` 未构建；裸机部署需先 `npm run build` 再 `go build` |
| nginx 401 / 反复跳登录 | tinyauth `APP_URL` 与登录回跳参数和当前版本官方文档不一致；按文档校正 |
| 访问日志中看不到 `/healthz` | 这是预期的，由 Gin `SkipPaths` 主动屏蔽 |
