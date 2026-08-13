#!/usr/bin/env bash

set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -n "${PYTHON_BIN:-}" ]]; then
  python_bin="${PYTHON_BIN}"
elif [[ -x "${repository_root}/.venv/bin/python" ]]; then
  python_bin="${repository_root}/.venv/bin/python"
else
  python_bin="python3"
fi

cd "${repository_root}"

"${python_bin}" -m compileall app tests
"${python_bin}" -m pytest

npm --prefix frontend run typecheck
npm --prefix frontend run lint
npm --prefix frontend run test:unit
npm --prefix frontend run build
PYTHON_BIN="${python_bin}" npm --prefix frontend run test:e2e

git diff --check
