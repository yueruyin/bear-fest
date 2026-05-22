# Bear Fest 项目总览

## 项目介绍

Bear Fest 是一个活动服务平台示例项目，包含：

- 后端：`FastAPI + SQLAlchemy + SQLite`
- 前端：`React + Vite + React Router`
- 目标：覆盖官网展示、线索收集、商家报名与后台管理的完整最小闭环

后端启动时会自动建表，并初始化：

- 默认站点配置
- 示例案例数据（已发布）
- 管理员角色（`admin`）
- 管理员账号（仅当设置 `ADMIN_BOOTSTRAP_PASSWORD` 且当前无用户时创建）

## 项目结构

```text
bear-fest/
├── app/                   # FastAPI 后端代码（API、模型、Schema、数据库初始化）
│   └── uploads/merchant/  # 商家报名上传文件保存目录（运行时自动创建）
├── frontend/              # React 前端代码
│   └── public/            # 静态资源（案例轮播图、城市图片等）
├── docs/                  # 产品/系统设计文档与素材
├── app.db                 # SQLite 数据库文件（运行后自动生成/更新）
└── requirements.txt       # 后端 Python 依赖
```

## 主要功能

### 前台（公开访问）

- 首页展示：Hero、服务能力、精选案例
- 案例中心：案例列表筛选、案例详情
- 联系我们：提交咨询线索
- 商家入驻：提交商家资料并支持文件上传

### 后台（管理员）

- 管理员登录（JWT）
- 站点配置管理（首页标题、服务亮点、联系方式）
- 线索列表查询与状态更新
- 商家报名列表查询与状态更新
- 案例管理：列表、详情、创建、编辑、状态控制（草稿/发布）
- 线索与商家报名 CSV 导出

### 其他

- 健康检查：`/health`
- 静态文件托管：`/uploads/*`（商家报名附件）

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
# 可选：用于初始化管理员账号（首次且无用户时生效）
export ADMIN_BOOTSTRAP_USERNAME=admin
export ADMIN_BOOTSTRAP_PASSWORD=your_password
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

# 初始化数据库（可选）
python3 -m app.init_db
```

## API 概览

### 公开 API

- `GET /health`：服务健康状态
- `GET /api/v1/site-config`：站点配置
- `GET /api/v1/cases`：案例列表（仅返回已发布，支持 `event_type`、分页）
- `GET /api/v1/cases/{slug}`：案例详情（仅已发布）
- `POST /api/v1/leads`：创建咨询线索
- `POST /api/v1/merchant-signups`：提交商家报名（`multipart/form-data`，支持多文件）

### 管理后台 API（需 Bearer Token）

- `POST /api/admin/login`：管理员登录
- `GET/PUT /api/admin/site-config`：查询/更新站点配置
- `GET /api/admin/leads`：线索列表（支持 `status`、`q`、分页）
- `PATCH /api/admin/leads/{lead_id}`：更新线索状态
- `GET /api/admin/merchant-signups`：商家报名列表（支持 `status`、`q`、分页）
- `PATCH /api/admin/merchant-signups/{signup_id}`：更新商家报名状态
- `GET /api/admin/cases`：案例列表（支持 `event_type`、`publish_status`、`q`、分页）
- `GET /api/admin/cases/{case_id}`：案例详情
- `POST /api/admin/cases`：创建案例
- `PUT /api/admin/cases/{case_id}`：更新案例
- `GET /api/admin/export/leads.csv`：导出线索 CSV
- `GET /api/admin/export/merchant-signups.csv`：导出商家报名 CSV

## 备注

- 数据库为本地 `SQLite`，默认文件是根目录 `app.db`
- 首次启动后端会自动建表并写入基础种子数据
- 商家附件会保存到 `app/uploads/merchant/`，并通过 `/uploads` 路径对外访问
