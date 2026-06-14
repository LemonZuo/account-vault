# Account Vault

个人数据管理工具，针对一台 MySQL 实例上的若干数据表提供新增、查看、修改与删除能力。
默认面向可信网络环境；如需公网暴露，应在外层增加访问控制。

## 功能

- 单一界面集中管理 9 张账号/凭据表（Apple、OpenAI、Claude、IDC Flare、Linux.do、宽带账户、软件账号、组件账号、中间件账号）。
- 后端使用泛型 CRUD，所有表共用同一套增删改查实现。
- 前端使用卡片式现代极简风格，桌面端与移动端均自适应。
- 单二进制发布：前端构建产物通过 `//go:embed all:frontend/dist` 嵌入 Go 二进制。

## 不在范围

- 不内置鉴权：默认运行于可信内网，公网访问应由反向代理 + tinyauth 等鉴权层前置。
- 不做主动型任务：调度、通知、外部 SDK 不在范围。
- 不存储任意富文本/文件：仅维护结构化、字段固定的数据表。

## 技术栈

- 后端：Go 1.25+、Gin、GORM、MySQL 驱动、godotenv。
- 前端：React 19、Vite、TypeScript、Tailwind CSS v4、react-router-dom、axios、lucide-react。
- 部署：前端构建产物通过 `//go:embed all:frontend/dist` 嵌入 Go 二进制，最终以单二进制方式运行。

## 文档导航

按场景拆分，按需查阅：

- [docs/deployment.md](docs/deployment.md) — 部署：数据库准备、Docker Compose、裸机二进制 + systemd、Nginx + tinyauth 反代、健康检查、发布与备份、故障排查。
- [docs/development.md](docs/development.md) — 开发：环境要求、目录结构、`.env` 配置项详表、启动顺序、本地开发、常用命令、新增表流程。
- [docs/api.md](docs/api.md) — API：通用约定、健康检查与版本、表元信息、9 张表共用的通用 CRUD 端点。

## Quick start

最小启动路径，详细说明参见上方文档。

```sh
# 1. 准备 MySQL 与 .env（后端不做 AutoMigrate，需预先建表）
cp .env.example .env
mysql -uroot -p -e "CREATE DATABASE IF NOT EXISTS account_vault DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
# 按 internal/model/models.go 中各结构体创建 tb_* 表

# 2. 启动后端（默认监听 :8080）
export PATH=/opt/module/go/go1.25.0/bin:$PATH
go run .

# 3. 启动前端（:5173，/api 默认代理至 :8080）
cd frontend && npm install && npm run dev
```

容器化部署参见 [docs/deployment.md](docs/deployment.md) 中的 Docker Compose 章节。

## 设计要点

- **部署边界**：默认面向可信网络环境；如需公网暴露，应在外层增加访问控制。
- **响应式**：宽度 ≥ 640px 显示左侧固定导航；移动端采用顶栏配合底部横向滚动 tab。
- **新增 / 编辑**：底部弹出的卡片式 Modal，移动端表现接近原生 sheet。
- **日志**：统一使用 `internal/logx`（slog + 自定义可读 handler）；gorm 错误与慢 SQL（> 300ms）自动按级别接入 logx，`LOG_LEVEL=debug` 时输出每条 SQL。
