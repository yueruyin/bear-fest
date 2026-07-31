#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

validate_env
mkdir -p data/mysql

compose up -d --build --remove-orphans

echo
compose ps
echo
echo "部署命令已完成。查看实时日志："
echo "  cd deploy && docker compose --env-file .env -f compose.yaml logs -f"
