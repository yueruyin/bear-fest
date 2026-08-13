from __future__ import annotations

import os
import sys
import tempfile
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
        from app.init_db import init_db
        from app.main import app

        init_db()
        uvicorn.run(app, host=host, port=port, log_level="warning")


if __name__ == "__main__":
    main()
