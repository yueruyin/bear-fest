from __future__ import annotations

import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import uvicorn


def main() -> None:
    repository_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repository_root))
    host = os.getenv("E2E_BACKEND_HOST", "127.0.0.1")
    port = int(os.getenv("E2E_BACKEND_PORT", "18001"))

    with tempfile.TemporaryDirectory(prefix="bear-fest-e2e-") as temp_dir:
        test_root = Path(temp_dir).resolve()
        os.environ["APP_ENV"] = "test"
        os.environ["DATABASE_URL"] = f"sqlite:///{test_root / 'app.db'}"
        os.environ["UPLOADS_ROOT"] = str(test_root / "uploads")
        os.environ["ADMIN_JWT_SECRET"] = "e2e-only-jwt-secret"
        os.environ["ADMIN_JWT_EXPIRES_MINUTES"] = "60"
        os.environ["ADMIN_BOOTSTRAP_USERNAME"] = "e2e-admin"
        os.environ["ADMIN_BOOTSTRAP_PASSWORD"] = "e2e-admin-password-123"
        os.environ["RUN_DB_INIT"] = "0"

        # Import after configuring the isolated database and upload directory.
        from app.database import SessionLocal
        from app.init_db import init_db
        from app.main import app
        from app.model import Case

        init_db()
        with SessionLocal() as db:
            case = db.query(Case).filter(Case.slug == "wtt-chongqing-example").one()
            case.project_background = (
                "这是仅用于 Playwright 隔离环境的完整项目背景，不会写入开发或生产数据库。"
            )
            case.project_goals = "验证已发布案例能够通过公开列表进入详情页。"
            case.execution_highlights = (
                '[{"title":"端到端验证","description":"验证公开案例详情的完整访问路径。"}]'
            )
            case.publish_status = "published"
            case.published_at = datetime.now(timezone.utc).replace(tzinfo=None)
            db.commit()
        uvicorn.run(app, host=host, port=port, log_level="warning")


if __name__ == "__main__":
    main()
