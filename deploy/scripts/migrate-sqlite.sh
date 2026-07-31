#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

MODE="${1:---preview}"
SOURCE_FILE="${2:-$DEPLOY_DIR/data/migration/app.db}"

require_env_file

if [ ! -f "$SOURCE_FILE" ]; then
  echo "找不到SQLite文件：$SOURCE_FILE"
  echo "请先把旧app.db上传到 deploy/data/migration/app.db。"
  exit 1
fi

SOURCE_DIR="$(cd "$(dirname "$SOURCE_FILE")" && pwd)"
SOURCE_FILE="$SOURCE_DIR/$(basename "$SOURCE_FILE")"

run_migration() {
  compose run --rm --no-deps \
    --entrypoint python \
    -v "$SOURCE_FILE:/migration/app.db:ro" \
    backend \
    -m app.tools.migrate_sqlite_to_mysql \
    --source /migration/app.db \
    "$@"
}

case "$MODE" in
  --preview)
    run_migration
    ;;
  --apply)
    echo "正式迁移会用SQLite数据替换MySQL中的所有业务表。"
    echo "正在备份当前MySQL和上传文件……"
    "$SCRIPT_DIR/backup.sh"

    compose stop backend
    restart_backend() {
      compose up -d backend >/dev/null
    }
    trap restart_backend EXIT

    run_migration --replace-target --confirm REPLACE_MYSQL_DATA

    compose up -d backend
    trap - EXIT
    compose exec -T backend curl -fsS http://127.0.0.1:8000/ready
    echo
    echo "SQLite到MySQL迁移完成。"
    ;;
  *)
    echo "用法："
    echo "  ./scripts/migrate-sqlite.sh --preview [SQLite文件]"
    echo "  ./scripts/migrate-sqlite.sh --apply [SQLite文件]"
    exit 1
    ;;
esac
