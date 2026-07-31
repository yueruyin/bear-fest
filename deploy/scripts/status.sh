#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

require_env_file
compose ps

echo
echo "后端健康状态："
compose exec -T backend curl -fsS http://127.0.0.1:8000/ready
echo
