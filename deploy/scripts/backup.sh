#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

require_env_file

BACKUP_DIR="$DEPLOY_DIR/backups"
STAMP="$(date '+%Y%m%d-%H%M%S')"
PROJECT_NAME="$(grep -E '^COMPOSE_PROJECT_NAME=' .env | tail -n 1 | cut -d= -f2- || true)"
PROJECT_NAME="${PROJECT_NAME:-bear-fest}"
mkdir -p "$BACKUP_DIR"

compose exec -T mysql sh -c \
  'exec mysqldump --single-transaction --routines --triggers -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  | gzip > "$BACKUP_DIR/mysql-$STAMP.sql.gz"

docker run --rm \
  -v "${PROJECT_NAME}_uploads_data:/data:ro" \
  -v "$BACKUP_DIR:/backup" \
  alpine:3.22 \
  tar -czf "/backup/uploads-$STAMP.tar.gz" -C /data .

echo "备份完成："
echo "  $BACKUP_DIR/mysql-$STAMP.sql.gz"
echo "  $BACKUP_DIR/uploads-$STAMP.tar.gz"
