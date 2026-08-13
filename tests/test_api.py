from __future__ import annotations

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.model import Lead, MerchantSignup
from tests.conftest import (
    TEST_ADMIN_PASSWORD,
    TEST_ADMIN_USERNAME,
    TEST_UPLOADS_ROOT,
)


def test_health_and_readiness(client: TestClient):
    health_response = client.get("/health")
    assert health_response.status_code == 200
    assert health_response.json() == {"status": "ok"}

    readiness_response = client.get("/ready")
    assert readiness_response.status_code == 200
    assert readiness_response.json() == {"status": "ready"}


def test_admin_login_accepts_valid_credentials(client: TestClient):
    response = client.post(
        "/api/admin/login",
        json={"username": TEST_ADMIN_USERNAME, "password": TEST_ADMIN_PASSWORD},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]


def test_admin_login_rejects_invalid_password(client: TestClient):
    response = client.post(
        "/api/admin/login",
        json={"username": TEST_ADMIN_USERNAME, "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "invalid credentials"


def test_public_case_list_only_returns_published_cases(client: TestClient):
    response = client.get("/api/v1/cases")

    assert response.status_code == 200
    payload = response.json()
    assert [item["slug"] for item in payload] == ["published-test-case"]
    assert payload[0]["publish_status"] == "published"


def test_contact_lead_submission_is_persisted(client: TestClient):
    response = client.post(
        "/api/v1/leads",
        json={
            "name": "测试客户",
            "company": "测试公司",
            "phone_or_email": "customer@example.com",
            "demand_desc": "这是一个用于自动化测试的合作咨询需求。",
            "source_page": "/contact",
        },
    )

    assert response.status_code == 201
    assert response.json()["status"] == "new"
    with SessionLocal() as db:
        lead = db.query(Lead).filter(Lead.id == response.json()["id"]).one()
        assert lead.name == "测试客户"
        assert lead.source_page == "/contact"


def test_merchant_signup_accepts_multipart_and_file(client: TestClient):
    response = client.post(
        "/api/v1/merchant-signups",
        data={
            "contact_name": "测试商户",
            "brand_name": "测试品牌",
            "phone_or_email": "merchant@example.com",
            "business_details": "这是一个用于自动化测试的商户报名说明。",
        },
        files={
            "files": (
                "shop.png",
                b"\x89PNG\r\n\x1a\npytest-image",
                "image/png",
            )
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "new"
    assert payload["files"][0]["file_name"] == "shop.png"
    assert payload["files"][0]["file_url"].startswith("/uploads/merchant/")
    stored_file = TEST_UPLOADS_ROOT / payload["files"][0]["file_url"].removeprefix(
        "/uploads/"
    )
    assert stored_file.is_file()
    with SessionLocal() as db:
        signup = db.query(MerchantSignup).filter(MerchantSignup.id == payload["id"]).one()
        assert signup.brand_name == "测试品牌"
        assert len(signup.files) == 1


def test_admin_routes_require_authentication(
    client: TestClient,
    admin_headers: dict[str, str],
):
    unauthenticated_response = client.get("/api/admin/cases")
    assert unauthenticated_response.status_code == 401

    authenticated_response = client.get("/api/admin/cases", headers=admin_headers)
    assert authenticated_response.status_code == 200
    assert {item["slug"] for item in authenticated_response.json()} == {
        "published-test-case",
        "draft-test-case",
    }
