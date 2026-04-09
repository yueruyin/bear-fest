from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

CONFIG_PATH = Path("app/config/config_dev.yml")


def _load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    return data if isinstance(data, dict) else {}


_CFG = _load_yaml(CONFIG_PATH)


def _get_nested(obj: dict[str, Any], *keys: str) -> Any:
    cur: Any = obj
    for k in keys:
        if not isinstance(cur, dict) or k not in cur:
            return None
        cur = cur[k]
    return cur


ADMIN_JWT_SECRET: str = str(_get_nested(_CFG, "jwt", "admin_secret") or "").strip()
ADMIN_JWT_EXPIRES_MINUTES: int = int(_get_nested(_CFG, "jwt", "expires_minutes") or 720)

