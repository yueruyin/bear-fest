# Bear Fest Docker Compose 部署

本目录用于将 Bear Fest 部署到一台互联网服务器，包含：

- Caddy：提供前端静态页面、反向代理和自动 HTTPS
- FastAPI：提供公开接口和管理员接口
- MySQL 8.4：保存站点配置、咨询、报名和案例数据
- `deploy/data/mysql`：持久化 MySQL 数据文件
- Docker volumes：持久化上传文件和 HTTPS 证书

## 服务器要求

- 推荐 Ubuntu 22.04/24.04、2 核 4 GB、50 GB 磁盘
- 已安装 Docker Engine 和 Docker Compose v2
- 正式环境开放 TCP 80、TCP 443 和 UDP 443
- 域名 A/AAAA 记录已解析到服务器；使用中国大陆服务器时需先完成备案

## 首次部署

在项目根目录执行：

```bash
cd deploy
chmod +x backend-entrypoint.sh scripts/*.sh
./scripts/init.sh
```

### 配置阿里云Docker镜像加速

Docker基础镜像仍需要从Docker Hub获取。登录阿里云控制台，进入：

```text
容器镜像服务 ACR → 镜像工具 → 镜像加速器
```

复制当前账号的专属地址，然后执行：

```bash
./scripts/configure-docker-mirror.sh https://你的专属地址.mirror.aliyuncs.com
```

该脚本会保留 `/etc/docker/daemon.json` 中的其他配置，修改前自动备份，并重启
Docker。阿里云官方说明其加速地址与账号关联；部分新镜像可能尚未同步，如果
指定版本仍无法拉取，需要改用ACR制品订阅或将镜像提前推送至自己的ACR仓库。

编辑生成的 `.env`：

```dotenv
SITE_ADDRESS=example.com
MYSQL_PASSWORD=一段至少16位的随机密码
MYSQL_ROOT_PASSWORD=另一段至少16位的随机密码
ADMIN_JWT_SECRET=至少32位的随机字符串
ADMIN_BOOTSTRAP_PASSWORD=管理员初始强密码
```

`MYSQL_USER` 必须是 `bear_fest` 等普通数据库账号，不能填写 `root`。应用使用
`MYSQL_USER` 和 `MYSQL_PASSWORD` 连接数据库，`MYSQL_ROOT_PASSWORD` 仅用于
MySQL初始化和数据库备份。

不要在 `SITE_ADDRESS` 后添加路径。域名解析生效且 80/443 端口可访问后，Caddy
会自动申请 HTTPS 证书。

执行部署：

```bash
./scripts/deploy.sh
./scripts/status.sh
```

访问地址：

```text
https://example.com
https://example.com/admin/login
https://example.com/health
https://example.com/ready
```

管理员账户只会在数据库中不存在用户时创建。部署成功后，修改 `.env` 中的
`ADMIN_BOOTSTRAP_PASSWORD` 不会自动修改已存在账户的密码。

## 本机测试

本机测试时保持：

```dotenv
SITE_ADDRESS=:80
HTTP_PORT=8080
```

启动后访问 `http://127.0.0.1:8080`。本机测试无需开放 443；若本机 443
已被占用，可将 `HTTPS_PORT` 改为其他未使用端口。

## 更新版本

拉取新代码后，可将 `.env` 中的 `APP_TAG` 改成日期或 Git commit，例如：

```dotenv
APP_TAG=20260730-1
```

然后重新执行：

```bash
./scripts/deploy.sh
```

Compose 会重新构建并替换应用容器，不会删除数据库目录和上传文件卷。

## MySQL数据目录

MySQL数据绑定挂载到部署目录：

```text
deploy/data/mysql
```

容器内对应 `/var/lib/mysql`。`deploy/data/` 已被Git忽略，不能提交数据库文件。
不要在MySQL运行期间直接复制或编辑该目录。

如果服务器此前已经使用 `bear-fest_mysql_data` 命名卷并且其中存在正式数据，
需要在切换新版Compose前执行一次迁移：

```bash
cd deploy
docker compose --env-file .env -f compose.yaml down
mkdir -p data/mysql
docker run --rm \
  -v bear-fest_mysql_data:/source:ro \
  -v "$PWD/data/mysql:/target" \
  alpine:3.22 \
  sh -c 'cp -a /source/. /target/'
```

如果修改过 `COMPOSE_PROJECT_NAME`，先执行 `docker volume ls | grep mysql_data`
确认旧卷的实际名称，并替换上述命令中的 `bear-fest_mysql_data`。

确认复制结果：

```bash
sudo du -sh data/mysql
sudo ls -la data/mysql | head
```

再执行 `./scripts/deploy.sh`。确认新挂载运行和数据无误前，不要删除旧命名卷。

## 从本地可视化工具连接MySQL

MySQL只绑定到服务器回环地址 `127.0.0.1:3306`，不会直接暴露到公网。推荐使用
Navicat、DBeaver或DataGrip自带的SSH隧道功能：

数据库连接：

```text
数据库主机：127.0.0.1
数据库端口：3306
数据库名称：bear_fest
数据库用户：bear_fest
数据库密码：deploy/.env 中的 MYSQL_PASSWORD
```

SSH隧道：

```text
SSH主机：服务器公网IP
SSH端口：22
SSH用户：ubuntu
认证方式：服务器登录使用的私钥或密码
```

也可以先在本地终端建立隧道：

```bash
ssh -N -L 13306:127.0.0.1:3306 ubuntu@服务器公网IP
```

然后让数据库工具连接 `127.0.0.1:13306`。服务器安全组无需、也不应该开放
公网3306端口。

## 国内依赖源

Compose构建默认使用：

- Debian：`mirrors.aliyun.com`
- Python/PyPI：`mirrors.aliyun.com/pypi`
- Node/npm：`registry.npmmirror.com`
- Docker基础镜像：使用上文配置的阿里云账号专属镜像加速器

前端构建还会把 `package-lock.json` 中原内部Nexus的下载地址临时改写成
`registry.npmmirror.com`，不会修改项目工作区里的锁文件。若某个国内源临时
不可用，可以在 `.env` 中覆盖 `DEBIAN_MIRROR`、`PYPI_INDEX_URL` 或
`NPM_REGISTRY`。

## 日志和状态

```bash
docker compose --env-file .env -f compose.yaml ps
docker compose --env-file .env -f compose.yaml logs -f --tail=200
docker compose --env-file .env -f compose.yaml logs -f backend
```

## 数据备份

执行：

```bash
./scripts/backup.sh
```

备份文件保存到 `deploy/backups/`，包括 MySQL SQL 压缩包和上传文件压缩包。
请再将该目录同步到另一台机器或对象存储，避免服务器磁盘故障时备份同时丢失。

建议通过 `crontab -e` 设置每日备份：

```cron
30 3 * * * cd /你的项目绝对路径/deploy && ./scripts/backup.sh >> backup.log 2>&1
```

## 停止服务

```bash
docker compose --env-file .env -f compose.yaml down
```

不要随意执行 `down -v`，其中的 `-v` 会删除 MySQL、上传文件和证书数据卷。

## 关于旧 SQLite 数据

该部署首次启动时会创建一个新的MySQL数据库，不会自动导入项目根目录中的
`app.db`。迁移步骤如下。

先更新服务器代码并执行一次 `./scripts/deploy.sh`，确保后端镜像中已经包含
迁移工具。

先从本地电脑上传旧库：

```bash
ssh ubuntu@服务器公网IP 'mkdir -p /服务器项目路径/deploy/data/migration'
scp /本地项目路径/app.db \
  ubuntu@服务器公网IP:/服务器项目路径/deploy/data/migration/app.db
```

在服务器预览源库和MySQL各表数量，预览不会写入MySQL：

```bash
cd /服务器项目路径/deploy
./scripts/migrate-sqlite.sh --preview
```

确认数量后正式迁移：

```bash
./scripts/migrate-sqlite.sh --apply
```

正式迁移会先执行 `backup.sh`，然后暂停后端、清空MySQL中的Bear Fest业务表、
保留原ID导入SQLite数据、核对各表数量，最后重新启动后端。迁移期间网站接口
会短暂不可用。

迁移会保留旧管理员账号和密码哈希。如果旧库仍使用演示密码，迁移后必须立即
重置：

```bash
./scripts/reset-admin-password.sh admin
```

### 同步旧上传文件

数据库中的案例图片和商户附件使用 `/uploads/...` 路径，数据库迁移不会自动
复制实际文件。先从本地上传：

```bash
scp -r /本地项目路径/app/uploads \
  ubuntu@服务器公网IP:/服务器项目路径/deploy/data/migration/
```

然后在服务器复制到现有上传卷：

```bash
cd /服务器项目路径/deploy
docker run --rm \
  -v "$PWD/data/migration/uploads:/source:ro" \
  -v bear-fest_uploads_data:/target \
  alpine:3.22 \
  sh -c 'cp -a /source/. /target/'
```

如果修改过 `COMPOSE_PROJECT_NAME`，先执行 `docker volume ls | grep uploads_data`
确定上传卷名称。完成后打开案例图片和商户附件进行抽查。
