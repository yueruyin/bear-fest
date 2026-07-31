#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$DEPLOY_DIR"

compose() {
  docker compose --env-file .env -f compose.yaml "$@"
}

require_env_file() {
  if [ ! -f .env ]; then
    echo "缺少 deploy/.env。请先执行 ./scripts/init.sh 并填写生产配置。"
    exit 1
  fi
}

validate_env() {
  require_env_file

  local invalid=0
  local required=(
    MYSQL_DATABASE
    MYSQL_USER
    MYSQL_PASSWORD
    MYSQL_ROOT_PASSWORD
    ADMIN_JWT_SECRET
    ADMIN_BOOTSTRAP_PASSWORD
  )

  for key in "${required[@]}"; do
    local value
    value="$(grep -E "^${key}=" .env | tail -n 1 | cut -d= -f2- || true)"
    if [ -z "$value" ] || [[ "$value" == CHANGE_ME* ]]; then
      echo "请在 deploy/.env 中设置 $key"
      invalid=1
    fi
  done

  if [ "$invalid" -ne 0 ]; then
    exit 1
  fi

  local mysql_password
  local mysql_user
  local mysql_user_lower
  local jwt_secret
  local admin_password
  mysql_user="$(grep -E '^MYSQL_USER=' .env | tail -n 1 | cut -d= -f2-)"
  mysql_user_lower="$(printf '%s' "$mysql_user" | tr '[:upper:]' '[:lower:]')"
  mysql_password="$(grep -E '^MYSQL_PASSWORD=' .env | tail -n 1 | cut -d= -f2-)"
  jwt_secret="$(grep -E '^ADMIN_JWT_SECRET=' .env | tail -n 1 | cut -d= -f2-)"
  admin_password="$(grep -E '^ADMIN_BOOTSTRAP_PASSWORD=' .env | tail -n 1 | cut -d= -f2-)"

  if [ "$mysql_user_lower" = "root" ]; then
    echo "MYSQL_USER 不能设置为 root，请使用 bear_fest 等普通数据库账号"
    invalid=1
  fi
  if [ "${#mysql_password}" -lt 16 ]; then
    echo "MYSQL_PASSWORD 长度至少需要 16 位"
    invalid=1
  fi
  if [ "${#jwt_secret}" -lt 32 ]; then
    echo "ADMIN_JWT_SECRET 长度至少需要 32 位"
    invalid=1
  fi
  if [ "${#admin_password}" -lt 12 ]; then
    echo "ADMIN_BOOTSTRAP_PASSWORD 长度至少需要 12 位"
    invalid=1
  fi
  if [ "$invalid" -ne 0 ]; then
    exit 1
  fi

  compose config --quiet
}
