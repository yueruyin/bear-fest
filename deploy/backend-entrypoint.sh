#!/usr/bin/env sh
set -eu

python - <<'PY'
import time

from sqlalchemy import text
from app.database import engine

attempts = 30
for attempt in range(1, attempts + 1):
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("数据库连接成功")
        break
    except Exception as exc:
        if attempt == attempts:
            raise
        print(f"等待数据库就绪 ({attempt}/{attempts}): {exc}")
        time.sleep(2)
PY

if [ "${RUN_DB_INIT:-1}" = "1" ]; then
  python -m app.init_db
  export RUN_DB_INIT=0
fi

exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers "${UVICORN_WORKERS:-1}" \
  --proxy-headers \
  --forwarded-allow-ips='*'
