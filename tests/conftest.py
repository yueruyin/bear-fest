from __future__ import annotations

import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


TEST_ADMIN_USERNAME = "test-admin"
TEST_ADMIN_PASSWORD = "test-admin-password-123"

_test_directory = tempfile.TemporaryDirectory(prefix="bear-fest-pytest-")
TEST_ROOT = Path(_test_directory.name).resolve()
TEST_DATABASE_PATH = TEST_ROOT / "app.db"
TEST_UPLOADS_ROOT = TEST_ROOT / "uploads"

# Settings and the SQLAlchemy engine are created at module-import time. These values
# must be present before importing any application module.
os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DATABASE_PATH}"
os.environ["UPLOADS_ROOT"] = str(TEST_UPLOADS_ROOT)
os.environ["ADMIN_JWT_SECRET"] = "pytest-only-jwt-secret"
os.environ["ADMIN_JWT_EXPIRES_MINUTES"] = "60"
os.environ["RUN_DB_INIT"] = "0"

from app.auth import hash_password  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.model import Case, Role, SiteConfig, User  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_environment():
    yield
    engine.dispose()
    _test_directory.cleanup()


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        admin_role = Role(name="admin")
        db.add(admin_role)
        db.flush()
        db.add(
            User(
                username=TEST_ADMIN_USERNAME,
                password_hash=hash_password(TEST_ADMIN_PASSWORD),
                is_active=True,
                role_id=admin_role.id,
            )
        )
        db.add(
            SiteConfig(
                home_hero_title="测试首页",
                home_hero_subtitle="测试环境站点说明",
                service_highlights='["测试服务"]',
                contact_channels='{"email":"test@example.com"}',
            )
        )
        db.add(
            Case(
                title="测试已发布案例",
                slug="published-test-case",
                event_type="sports",
                summary="用于验证公开案例列表和详情接口。",
                cover_image_url="/uploads/cases/test-cover.jpg",
                gallery_urls="[]",
                publish_status="published",
                published_at=datetime.now(timezone.utc).replace(tzinfo=None),
                tags='["测试"]',
                seo_title="测试案例",
                seo_description="测试案例描述",
            )
        )
        db.add(
            Case(
                title="测试草稿案例",
                slug="draft-test-case",
                event_type="brand",
                summary="草稿不得出现在公开案例列表。",
                cover_image_url="/uploads/cases/draft-cover.jpg",
                gallery_urls="[]",
                publish_status="draft",
                published_at=None,
                tags="[]",
                seo_title="",
                seo_description="",
            )
        )
        db.commit()


@pytest.fixture
def client(reset_database):
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def admin_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/admin/login",
        json={"username": TEST_ADMIN_USERNAME, "password": TEST_ADMIN_PASSWORD},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
