# Bear Fest 项目总览

## 项目介绍

Bear Fest 是一个活动服务平台示例项目，包含：

- 后端：`FastAPI + SQLAlchemy + SQLite`
- 前端：`React + Vite + React Router`
- 目标：展示活动服务能力、案例列表/详情，以及线索收集（咨询表单）

当前后端启动时会自动初始化数据库，并写入默认站点配置和示例案例数据，便于本地快速联调。

## 项目结构

```text
bear-fest/
├── app/                 # FastAPI 后端代码（API、模型、Schema、数据库初始化）
├── frontend/            # React 前端代码
├── docs/                # 产品/系统设计文档与素材
├── app.db               # SQLite 数据库文件（运行后自动生成/更新）
└── requirements.txt     # 后端 Python 依赖
```

## 主要功能

- 首页展示：Hero、服务能力、代表案例
- 案例中心：案例列表筛选、案例详情页
- 联系我们：提交线索到后端接口
- 健康检查：`/health`

## 环境要求

- Python 3.10+
- Node.js 18+（建议）
- npm 9+（建议）

## 启动方式

### 1) 启动后端（FastAPI）

在项目根目录执行：

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动后可访问：

- 健康检查：`http://127.0.0.1:8000/health`
- 接口文档：`http://127.0.0.1:8000/docs`

### 2) 启动前端（Vite）

新开一个终端，进入 `frontend` 目录：

```bash
cd frontend
npm install
npm run dev
```

默认访问：

- 本机：`http://127.0.0.1:5173`
- 内网（已配置监听）：`http://<你的内网IP>:5173`

> 当前 `vite.config.js` 已配置 `host: '0.0.0.0'`，并允许 `cd-1.frp.one` 访问。

## 前后端联调说明

前端通过 `VITE_API_BASE_URL` 指定后端地址；若未配置，会默认使用当前页面主机名并走 `8000` 端口。

例如（在 `frontend` 目录）：

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

## 常用命令

```bash
# 前端构建
cd frontend && npm run build

# 前端代码检查
cd frontend && npm run lint

# 初始化数据库（可选）
python3 -m app.init_db
```

## 当前 API 概览

- `GET /health`：服务健康状态
- `GET /api/v1/site-config`：站点配置
- `GET /api/v1/cases`：案例列表（支持 `event_type`、分页）
- `GET /api/v1/cases/{slug}`：案例详情
- `POST /api/v1/leads`：创建咨询线索

## 备注

- 数据库为本地 `SQLite`，默认文件是根目录 `app.db`
- 首次启动后端会自动建表并写入基础种子数据
