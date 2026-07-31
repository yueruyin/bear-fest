from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import yaml

APP_ENV = os.getenv("APP_ENV", "dev").strip().lower()
_default_config_name = "config_prod.yml" if APP_ENV in {"prod", "production"} else f"config_{APP_ENV}.yml"
CONFIG_PATH = Path(os.getenv("CONFIG_FILE", f"app/config/{_default_config_name}"))


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


def _env_or_config(env_name: str, *config_keys: str, default: Any = None) -> Any:
    env_value = os.getenv(env_name)
    if env_value is not None:
        return env_value
    config_value = _get_nested(_CFG, *config_keys)
    return default if config_value is None else config_value


def _parse_origins(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    text = str(value or "").strip()
    if not text:
        return []
    if text.startswith("["):
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        except json.JSONDecodeError:
            pass
    return [item.strip() for item in text.split(",") if item.strip()]


APP_TITLE: str = str(_env_or_config("APP_TITLE", "app", "title", default="Bear Fest Backend"))
APP_VERSION: str = str(_env_or_config("APP_VERSION", "app", "version", default="0.1.0"))
DATABASE_URL: str = str(
    _env_or_config("DATABASE_URL", "database", "url", default="sqlite:///./app.db")
).strip()
UPLOADS_ROOT = Path(
    str(_env_or_config("UPLOADS_ROOT", "uploads", "root_dir", default="app/uploads"))
)
CORS_ALLOW_ORIGINS = _parse_origins(
    _env_or_config("CORS_ALLOW_ORIGINS", "cors", "allow_origins", default=[])
)
CORS_ALLOW_CREDENTIALS = str(
    _env_or_config("CORS_ALLOW_CREDENTIALS", "cors", "allow_credentials", default=True)
).lower() in {"1", "true", "yes", "on"}
ADMIN_JWT_SECRET: str = str(
    _env_or_config("ADMIN_JWT_SECRET", "jwt", "admin_secret", default="")
).strip()
ADMIN_JWT_EXPIRES_MINUTES: int = int(
    _env_or_config("ADMIN_JWT_EXPIRES_MINUTES", "jwt", "expires_minutes", default=720)
)
