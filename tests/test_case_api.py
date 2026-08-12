import json
from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.model import Case


def test_case_content_round_trip_and_publication_lifecycle(
    client: TestClient, complete_case_payload: dict[str, object]
) -> None:
    created = client.post("/api/admin/cases", json=complete_case_payload)
    assert created.status_code == 201, created.text
    case_id = created.json()["id"]

    assert client.get("/api/v1/cases/city-sports-case").status_code == 404

    admin_detail = client.get(f"/api/admin/cases/{case_id}")
    assert admin_detail.status_code == 200
    assert admin_detail.json()["project_background"] == complete_case_payload["project_background"]
    assert json.loads(admin_detail.json()["execution_highlights"])[0]["title"] == "现场统筹"

    update_payload = {key: value for key, value in complete_case_payload.items() if key != "slug"}
    update_payload["publish_status"] = "published"
    published = client.put(f"/api/admin/cases/{case_id}", json=update_payload)
    assert published.status_code == 200, published.text
    assert published.json()["published_at"] is not None

    public_detail = client.get("/api/v1/cases/city-sports-case")
    assert public_detail.status_code == 200
    assert public_detail.json()["project_goals"] == complete_case_payload["project_goals"]
    assert public_detail.json()["result_metrics"] == complete_case_payload["result_metrics"]
    assert public_detail.json()["gallery_urls"] == complete_case_payload["gallery_urls"]

    update_payload["publish_status"] = "draft"
    update_payload["published_at"] = published.json()["published_at"]
    reverted = client.put(f"/api/admin/cases/{case_id}", json=update_payload)
    assert reverted.status_code == 200
    assert reverted.json()["published_at"] is None
    assert client.get("/api/v1/cases/city-sports-case").status_code == 404


def test_two_sports_cases_keep_independent_content(
    client: TestClient, complete_case_payload: dict[str, object]
) -> None:
    first = dict(complete_case_payload, publish_status="published")
    second = dict(
        complete_case_payload,
        title="另一场普通赛事",
        slug="another-sports-case",
        project_background="这是另一条赛事案例独立保存的真实背景，不应出现第一条案例的内容。",
        project_goals="验证赛事案例之间不存在模板数据串用。",
        execution_highlights='[{"title":"独立内容","description":"这项亮点只属于第二条普通赛事案例。"}]',
        result_metrics="[]",
        result_summary=None,
        publish_status="published",
    )

    assert client.post("/api/admin/cases", json=first).status_code == 201
    assert client.post("/api/admin/cases", json=second).status_code == 201

    first_detail = client.get("/api/v1/cases/city-sports-case").json()
    second_detail = client.get("/api/v1/cases/another-sports-case").json()
    assert first_detail["project_background"] != second_detail["project_background"]
    assert json.loads(second_detail["result_metrics"]) == []
    assert "955" not in json.dumps(second_detail, ensure_ascii=False)


def test_publish_requires_background_goals_and_highlight(
    client: TestClient, complete_case_payload: dict[str, object]
) -> None:
    incomplete = dict(
        complete_case_payload,
        project_background=None,
        project_goals=None,
        execution_highlights="[]",
        publish_status="published",
    )
    response = client.post("/api/admin/cases", json=incomplete)
    assert response.status_code == 422
    assert "project_background" in response.text
    assert "project_goals" in response.text
    assert "execution_highlights" in response.text


def test_invalid_highlight_and_metric_json_is_rejected(
    client: TestClient, complete_case_payload: dict[str, object]
) -> None:
    invalid_json = dict(complete_case_payload, execution_highlights="not-json")
    assert client.post("/api/admin/cases", json=invalid_json).status_code == 422

    invalid_structure = dict(
        complete_case_payload,
        execution_highlights='[{"title":"A","description":"说明长度足够但标题太短"}]',
    )
    assert client.post("/api/admin/cases", json=invalid_structure).status_code == 422

    invalid_metric = dict(
        complete_case_payload,
        result_metrics='[{"label":"人数","value":"","unexpected":"x"}]',
    )
    assert client.post("/api/admin/cases", json=invalid_metric).status_code == 422


def test_historical_empty_fields_remain_publicly_readable(
    client: TestClient, db_session: Session
) -> None:
    historical = Case(
        title="历史最小案例",
        slug="historical-minimal",
        event_type="market",
        summary="历史案例只保留经过确认的基础内容。",
        cover_image_url="/uploads/cases/history.jpg",
        gallery_urls='["/uploads/cases/history-1.jpg"]',
        project_background=None,
        project_goals=None,
        execution_highlights=None,
        result_metrics=None,
        result_summary=None,
        publish_status="published",
        published_at=datetime(2026, 8, 1, 9, 0, 0),
        tags="[]",
        seo_title="",
        seo_description="",
    )
    db_session.add(historical)
    db_session.commit()
    db_session.execute(
        text(
            "UPDATE cases SET execution_highlights = NULL, result_metrics = NULL "
            "WHERE slug = 'historical-minimal'"
        )
    )
    db_session.commit()

    response = client.get("/api/v1/cases/historical-minimal")
    assert response.status_code == 200
    data = response.json()
    assert data["project_background"] is None
    assert data["execution_highlights"] is None
    assert data["gallery_urls"] == '["/uploads/cases/history-1.jpg"]'
