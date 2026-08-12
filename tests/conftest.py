from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import get_current_admin
from app.database import Base, get_db
from app.main import app


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def client(
    db_session: Session, monkeypatch: pytest.MonkeyPatch
) -> Generator[TestClient, None, None]:
    def override_db():
        yield db_session

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_admin] = lambda: object()
    monkeypatch.setenv("RUN_DB_INIT", "0")
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def complete_case_payload() -> dict[str, object]:
    return {
        "title": "城市赛事服务案例",
        "slug": "city-sports-case",
        "event_type": "sports",
        "summary": "只展示本案例已经保存并经过确认的项目内容。",
        "cover_image_url": "/uploads/cases/cover.jpg",
        "gallery_urls": '["/uploads/cases/first.jpg","/uploads/cases/second.jpg"]',
        "project_background": "这是一个经过确认的城市赛事项目背景，用于验证每条案例内容相互独立。",
        "project_goals": "完成赛事现场执行并提升参与体验。",
        "execution_highlights": (
            '[{"title":"现场统筹","description":"围绕赛事动线完成现场资源与执行团队统筹。"}]'
        ),
        "result_metrics": (
            '[{"label":"服务点位","value":"8个","description":"统计口径为正式开放点位"}]'
        ),
        "result_summary": "项目按计划完成，所有结果均来自本案例保存的数据。",
        "tags": '["赛事","现场运营"]',
        "seo_title": "城市赛事服务案例",
        "seo_description": "城市赛事服务案例复盘。",
        "publish_status": "draft",
    }
