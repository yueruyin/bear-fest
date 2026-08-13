# AGENTS.md

本文件适用于整个仓库。开始任务前先阅读 `README.md`、相关 `docs/` 文档以及将要修改的源码。本文描述的是当前仓库已经落地的实现；`docs/product-design.md`、`docs/system-design.md`、`docs/database-design.md` 中尚未实现的 PostgreSQL、Alembic、统一 API 包装、埋点、SEO、缓存等内容，只能作为目标或建议，不能当作现有能力。

## 1. 项目定位

Bear Fest（小熊团队）是活动服务公司的企业官网与内部运营后台。前台用于展示服务能力和项目案例，并收集合作咨询、商户报名及图片附件；后台用于管理员登录、站点文案维护、咨询与报名跟进、CSV 导出、案例图片上传及案例发布管理。

当前 MVP 不包含 C 端账号、支付、票务、复杂推荐、完整 CMS、CRM 对接等能力。除非任务明确要求，不得顺手扩展这些范围。

## 2. 前后端技术栈

- 后端：Python 3.10+、FastAPI、同步 SQLAlchemy 2.x ORM、Pydantic 2、Uvicorn、PyYAML。
- 鉴权与上传：`python-jose` JWT、Passlib `pbkdf2_sha256`、`python-multipart`、本地文件目录。
- 数据库：开发默认 SQLite；代码也支持通过 `DB_*` 环境变量连接 MySQL/MariaDB（`mysql+pymysql`）。当前依赖中没有 PostgreSQL 驱动。
- 前端：React 18、TypeScript 严格模式、React Router 6、Vite 5。
- UI：以 `frontend/src/index.css` 的全局语义类为主，同时包含 Tailwind CSS 4、shadcn/Radix UI、`lucide-react` 和少量可复用 UI 组件。
- 依赖锁定：前端以 `frontend/package-lock.json` 为准；后端 `requirements.txt` 当前未固定版本。
- Node.js 优先使用 20+。README 虽写 18+，但当前锁文件在 Node 18.20 安装时会对部分传递依赖给出 `EBADENGINE`（要求 Node 20+）警告；不要忽略新出现的安装或构建失败。
- 测试与静态检查：后端 pytest/FastAPI TestClient；前端 TypeScript `tsc`、ESLint、Vitest、Testing Library、Playwright Chromium。当前仍未配置 Prettier 或 CI，不得编造对应命令。

## 3. 目录结构

```text
bear-fest/
├── app/
│   ├── api/                 # FastAPI 前台/后台路由
│   ├── auth/                # JWT、密码与管理员依赖
│   ├── config/              # dev/test/prod YAML 与配置加载
│   ├── model/               # SQLAlchemy 模型
│   ├── schema/              # 当前使用的 Pydantic schema
│   ├── tools/               # SQLite→MySQL、重置管理员密码等运维工具
│   ├── uploads/             # 本地运行产生的上传文件，不是源码
│   ├── database.py          # Engine、SessionLocal、Base
│   ├── init_db.py           # create_all 与基础 seed
│   └── main.py              # 应用入口、中间件、静态上传目录、路由注册
├── frontend/
│   ├── public/              # 官网静态素材
│   ├── src/
│   │   ├── admin/           # 管理端 token 与 fetch/upload/download 封装
│   │   ├── components/      # 公共布局和 UI 组件
│   │   ├── constants/       # 前端常量
│   │   ├── hooks/           # 前台数据 hooks
│   │   ├── pages/           # 前台页面
│   │   ├── pages/admin/     # 运营后台页面
│   │   ├── App.tsx          # 路由表
│   │   ├── api.ts           # API_BASE_URL 规则
│   │   ├── index.css        # 实际生效的主要全局样式
│   │   ├── media.ts         # `/uploads/` 地址解析
│   │   └── types.ts         # 前台共享类型
│   ├── package.json
│   ├── package-lock.json
│   ├── eslint.config.js     # ESLint flat config
│   ├── vitest.config.ts     # 前端单元测试配置
│   ├── playwright.config.ts # Chromium E2E 与测试服务配置
│   ├── e2e/                 # 官网和后台核心浏览器路径
│   └── vite.config.js
├── deploy/                  # Caddy、Docker Compose、MySQL 与部署脚本
├── docs/                    # 产品/系统/数据库设计、截图和原始资料
├── app.db                   # 本地 SQLite 运行数据（被 gitignore 忽略）
├── requirements.txt
├── requirements-dev.txt     # pytest/httpx 等测试依赖
├── tests/                   # 后端 API 测试与 E2E 测试服务
├── scripts/verify.sh        # 全量统一验证入口
└── README.md
```

`app/schemas.py` 是旧的重复 schema 文件；当前路由使用 `app/schema/`。`AdminUser`/`admin_users` 也仍作为兼容模型存在，但实际管理员登录使用 `User`、`Role`。除非任务明确要求清理兼容代码，不要顺手删除或迁移。

## 4. 后端安装、启动、验证命令

在仓库根目录执行：

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

首次初始化一个全新数据库时，必须显式提供管理员密码：

```bash
ADMIN_BOOTSTRAP_USERNAME=admin ADMIN_BOOTSTRAP_PASSWORD='replace-with-a-strong-password' python3 -m app.init_db
```

正常开发启动：

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

可用入口：`GET /health`、`GET /ready`，非生产环境还有 `/docs`。只验证应用导入和 HTTP 服务、且不希望启动时执行 `init_db()` 时使用：

```bash
RUN_DB_INIT=0 uvicorn app.main:app --host 127.0.0.1 --port 8000
curl --fail http://127.0.0.1:8000/health
curl --fail http://127.0.0.1:8000/ready
```

后端静态语法验证：

```bash
python3 -m compileall app
```

## 5. 前端安装、启动、构建命令

前端有 npm 锁文件，使用 npm，不要混用 pnpm 或 yarn：

```bash
cd frontend
npm ci
npm run dev
```

开发脚本实际执行 `vite --mode dev`，会读取 `.env.dev`。前端 API 地址统一来自 `VITE_API_BASE_URL`；未设置时，开发环境回退到当前页面主机的 `8000` 端口，生产构建回退到同源。

生产构建和本地预览：

```bash
cd frontend
npm run build
npm run preview
```

前端测试和静态检查命令：

```bash
cd frontend
npm run typecheck
npm run lint
npm run test:unit
npm run test:e2e
```

Playwright 首次使用前执行 `npx playwright install chromium`。E2E 配置会自动启动独立的后端与前端服务，并使用临时 SQLite 数据库和临时上传目录；如需指定 Python 解释器，设置 `PYTHON_BIN=/path/to/python`。

## 6. 数据库注意事项

- 默认开发库是根目录 `app.db`；`APP_ENV=test` 使用 `app_test.db`。生产部署可通过 `DB_HOST`、`DB_DRIVER`、`DB_USER`、`DB_PASSWORD`、`DB_PORT`、`DB_NAME` 切换到 MySQL/MariaDB。
- `app/init_db.py` 使用 `Base.metadata.create_all()` 建表并写入基础 seed。它不会给已有表自动新增/修改字段，不能把它当作迁移系统。
- 当前仓库没有 Alembic。任何模型字段、约束、索引或关系变更，都必须同时评估 SQLite 与 MySQL、现有数据兼容、回滚和部署步骤；没有明确迁移方案时不得宣称数据库变更已完成。
- `site_configs.service_highlights`、`site_configs.contact_channels`、`cases.gallery_urls`、`cases.tags` 当前都是存放 JSON 字符串的 `TEXT` 字段，不是原生 JSON/JSONB。
- 当前业务主键是自增整数，不是设计文档建议的 UUID；时间字段也是当前 SQLAlchemy `DateTime` 实现。不要仅为了对齐设计文档改表。
- 启动应用默认会运行 `init_db()`；需要只读排查时设置 `RUN_DB_INIT=0`。
- 不得覆盖、删除或提交 `app.db`、`app_test.db`、`app/uploads/`。需要测试写操作时使用独立临时数据库和上传目录。
- `app.tools.migrate_sqlite_to_mysql` 的 `--replace-target` 会清空目标业务表；没有用户明确授权不得执行。预览也要先核对源文件和脱敏后的目标地址。
- 正式环境必须通过环境变量提供强 JWT 密钥和管理员凭据，禁止把真实密码、token、数据库口令写入 YAML、源码、日志或文档。

## 7. API 修改规范

- 前台接口保持 `/api/v1/...`；后台接口保持 `/api/admin/...`；健康检查保持 `/health` 与 `/ready`。
- 后台路由必须通过 `Depends(get_current_admin)` 保护，登录接口除外；不得绕过 JWT/角色校验。
- 路由放在 `app/api/`，请求/响应模型放在 `app/schema/`，ORM 放在 `app/model/`；新增导出后同步对应 `__init__.py`，新增路由后在 `app/main.py` 注册。
- 保持当前响应契约：接口直接返回 Pydantic 模型、列表、字典或 CSV，错误使用 FastAPI 的 `detail`。不要擅自套用设计文档中的 `{code,message,data,request_id}`，否则现有前端会不兼容。
- 修改字段、状态或响应形状时，同步检查后端 model/schema/router、`frontend/src/types.ts`、`frontend/src/admin/api.ts` 及消费页面。
- 现有状态值必须保持一致：咨询/报名为 `new | processing | done | archived`，案例为 `draft | published`；活动类型为 `sports | carnival | market | annual | brand`。新增或改名必须端到端迁移现有数据和 UI。
- 案例、站点配置中的数组/对象按当前约定序列化为 JSON 字符串；不要只改单侧类型。
- 上传接口继续使用 `multipart/form-data`。案例图片目前只接受经文件头识别的 JPG/PNG/GIF/WebP，单张不超过 8MB；商户附件当前校验较弱，涉及该接口时优先补齐大小、类型、异常清理与事务一致性测试。
- 数据写入必须正确处理 `commit`、失败回滚和关联文件清理；不要返回敏感字段或泄露内部异常。
- 对外契约变更必须更新 README/API 文档，并给出兼容或迁移说明。

## 8. 前端开发规范

- 保持 TypeScript `strict`，使用函数组件和 hooks；不要用 `any` 逃避可建模的接口类型。当前少量遗留 `any` 不应成为新增代码模板。
- 路由集中在 `frontend/src/App.tsx`，页面导出集中在 `frontend/src/pages/index.ts`；管理页面继续放在 `pages/admin/` 并由 `RequireAdminAuth` 保护。
- 所有 API 地址通过 `API_BASE_URL` 生成，禁止在页面硬编码后端域名。后台 JSON 请求、上传、下载优先复用 `adminFetch`、`adminUpload`、`adminDownload`；上传资源展示通过 `resolveMediaUrl()`。
- 保持现有后端错误 `detail` 到中文提示的处理方式；401 时清理 token 并引导重新登录。
- 主要站点样式实际来自 `frontend/src/index.css`；`App.css` 当前未被入口导入。新增语义类应放在相邻功能区，优先复用现有变量、按钮、表单、状态、响应式布局，不要重复造一套视觉系统。
- 修改页面时同时检查桌面端与窄屏断点，保留 `prefers-reduced-motion`、键盘焦点、语义 HTML、`aria-*`、图片 `alt`、加载/空状态/错误状态。
- 静态素材引用使用 `frontend/public/` 的根路径；上传素材使用后端返回的 `/uploads/...`。不要把运行时上传文件复制进源码或 public。
- 不新增依赖来解决少量样式或工具函数；确需新增依赖时先说明理由，只修改 `package.json` 和 `package-lock.json`，并重新执行 `npm ci`/`npm run build`。

## 9. 禁止修改的内容

除非任务明确把相应内容列为目标，否则禁止修改：

- 本地/生产数据与用户上传：`*.db`、`*.sqlite*`、`app/uploads/`。
- 生成物与缓存：`frontend/dist/`、`frontend/node_modules/`、`__pycache__/`、`*.pyc`、`.DS_Store`、`.playwright-cli/` 日志与快照。
- 原始业务资料和展示证据：`docs/wtt/`、`docs/*.pdf`、`docs/screenshots/`、`frontend/public/` 现有素材。
- 部署配置、域名、Caddy、Docker、数据库迁移/备份脚本，除非任务明确涉及部署。
- `package-lock.json` 和依赖清单，除非任务明确新增、升级或移除依赖。
- 与当前需求无关的兼容代码、命名、格式和历史遗留问题。

任何情况下都禁止提交密钥、token、真实密码、生产数据库连接串或客户联系方式。

## 10. 完成任务前必须执行的验证命令

安装测试依赖：

```bash
python3 -m pip install -r requirements-dev.txt
cd frontend
npm ci
npx playwright install chromium
```

代码任务完成前从仓库根目录执行统一验证：

```bash
./scripts/verify.sh
```

该脚本依次执行：

```bash
python3 -m compileall app tests
python3 -m pytest
npm --prefix frontend run typecheck
npm --prefix frontend run lint
npm --prefix frontend run test:unit
npm --prefix frontend run build
npm --prefix frontend run test:e2e
git diff --check
```

脚本默认优先使用 `.venv/bin/python`，也支持 `PYTHON_BIN=/path/to/python ./scripts/verify.sh`。pytest 和 Playwright 后端都使用临时数据库与上传目录，不得改成共享 `app.db` 或 `app/uploads/`。

涉及后端路由、配置或数据库读取且需要额外手工冒烟时，可再启动服务并验证：

```bash
RUN_DB_INIT=0 uvicorn app.main:app --host 127.0.0.1 --port 8000
curl --fail http://127.0.0.1:8000/health
curl --fail http://127.0.0.1:8000/ready
```

涉及页面、表单、鉴权、上传、响应式布局或视觉调整时，除现有 E2E 外，还必须在浏览器手动走通受影响路径，并在交付说明中列出已验证路径。若只改文档，可不运行全量代码测试，但仍需检查链接、命令和 `git diff --check`。

所有任务结束前执行：

```bash
git diff --check
git status --short
```

不得声称运行了不存在的测试，也不得掩盖验证失败；无法执行的命令要说明原因。ESLint 当前允许遗留 warning，但任何 error 都会使验证失败；不要为了清零警告大规模改写业务页面。

## 11. Git / 分支 / PR 约定

- 未经用户明确要求，不创建/切换分支，不提交，不推送，不创建 PR。本仓库默认分支是 `main`。
- 获得授权创建 Codex 工作分支时，使用 `codex/<short-kebab-topic>`；一个分支只处理一个明确主题。
- 不覆盖或回滚用户已有改动，不使用破坏性 reset/checkout，不做强推，不改写共享历史。
- commit 保持小而完整，提交信息简洁说明实际改动；不要混入格式化、生成物、运行数据或无关重构。
- PR 必须说明：背景与范围、主要改动、API/数据库/配置影响、兼容或迁移方式、实际执行的验证命令和结果；视觉变更附前后截图，未覆盖项明确列出。
- 合并前重新确认 `git diff` 只包含任务范围内文件，且没有密钥、数据库、上传文件、构建产物或缓存。

## 12. 小需求不得大规模重构

为完成一个小需求，只修改实现该需求所必需的最小文件和最小代码路径。不得顺手更换框架、状态管理、样式体系、路由方案、鉴权方案、数据库类型或 API 响应格式；不得把大型 `index.css`、后台页面或模型层整体重写；不得仅为“更整洁”删除兼容文件或批量重命名。

如果确实发现结构性问题会阻止任务完成，应先说明证据、影响范围、最小修复方案和更大重构方案的取舍，获得明确授权后再扩大范围。修复必须保持现有行为、数据和接口兼容，并为受影响路径补充与风险相称的验证。
