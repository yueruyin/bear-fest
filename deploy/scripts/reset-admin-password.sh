#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

USERNAME="${1:-admin}"
require_env_file

compose exec backend python -m app.tools.reset_admin_password --username "$USERNAME"
