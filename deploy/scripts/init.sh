#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$DEPLOY_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "未安装 Docker，请先安装 Docker Engine 和 Docker Compose 插件。"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "未安装 Docker Compose v2 插件。"
  exit 1
fi

mkdir -p data/mysql

if [ ! -f .env ]; then
  cp .env.example .env
  echo "已生成 deploy/.env。"
  echo "请填写域名、MySQL 密码、JWT 密钥和管理员初始密码，然后执行 ./scripts/deploy.sh。"
  exit 0
fi

echo "deploy/.env 已存在，不做覆盖。"
