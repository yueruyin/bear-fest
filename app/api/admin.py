import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_admin, verify_password
from app.database import get_db
from app.model import Case, Lead, MerchantSignup, SiteConfig, User
from app.schema import (
    AdminLoginIn,
    AdminTokenOut,
    CaseAdminListItem,
    CaseCreateIn,
    CaseUpdateIn,
    LeadAdminListItem,
    LeadStatusPatchIn,
    MerchantSignupAdminListItem,
    MerchantSignupStatusPatchIn,
    SiteConfigOut,
    SiteConfigUpdateIn,
)

router = APIRouter()


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _parse_int(value: int, min_value: int, max_value: int) -> int:
    return max(min_value, min(int(value), max_value))


@router.post("/api/admin/login", response_model=AdminTokenOut)
def admin_login(payload: AdminLoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="invalid credentials")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="invalid credentials")
    token = create_access_token(subject=user.username)
    return AdminTokenOut(access_token=token)


@router.get("/api/admin/site-config", response_model=SiteConfigOut)
def admin_get_site_config(
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    config = db.query(SiteConfig).order_by(SiteConfig.id.asc()).first()
    if not config:
        raise HTTPException(status_code=404, detail="site config not found")
    return config


@router.put("/api/admin/site-config", response_model=SiteConfigOut)
def admin_update_site_config(
    payload: SiteConfigUpdateIn,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    config = db.query(SiteConfig).order_by(SiteConfig.id.asc()).first()
    if not config:
        config = SiteConfig(
            home_hero_title=payload.home_hero_title,
            home_hero_subtitle=payload.home_hero_subtitle,
            service_highlights=payload.service_highlights,
            contact_channels=payload.contact_channels,
        )
        db.add(config)
        db.commit()
        db.refresh(config)
        return config

    config.home_hero_title = payload.home_hero_title
    config.home_hero_subtitle = payload.home_hero_subtitle
    config.service_highlights = payload.service_highlights
    config.contact_channels = payload.contact_channels
    db.commit()
    db.refresh(config)
    return config


@router.get("/api/admin/leads", response_model=list[LeadAdminListItem])
def admin_list_leads(
    status: str | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 20,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    page = _parse_int(page, 1, 1000000)
    page_size = _parse_int(page_size, 1, 100)
    query = db.query(Lead)
    if status:
        query = query.filter(Lead.status == status)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Lead.name.ilike(like),
                Lead.company.ilike(like),
                Lead.phone_or_email.ilike(like),
            )
        )
    offset = (page - 1) * page_size
    return query.order_by(Lead.created_at.desc(), Lead.id.desc()).offset(offset).limit(page_size).all()


@router.patch("/api/admin/leads/{lead_id}", response_model=LeadAdminListItem)
def admin_update_lead_status(
    lead_id: int,
    payload: LeadStatusPatchIn,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="lead not found")
    lead.status = payload.status.strip()
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/api/admin/merchant-signups", response_model=list[MerchantSignupAdminListItem])
def admin_list_merchant_signups(
    status: str | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 20,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    page = _parse_int(page, 1, 1000000)
    page_size = _parse_int(page_size, 1, 100)
    query = db.query(MerchantSignup)
    if status:
        query = query.filter(MerchantSignup.status == status)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                MerchantSignup.contact_name.ilike(like),
                MerchantSignup.brand_name.ilike(like),
                MerchantSignup.phone_or_email.ilike(like),
                MerchantSignup.business_details.ilike(like),
            )
        )
    offset = (page - 1) * page_size
    # Force-load relationship via access in schema (SQLAlchemy lazy load is ok for small page_size).
    items = (
        query.order_by(MerchantSignup.created_at.desc(), MerchantSignup.id.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return items


@router.patch(
    "/api/admin/merchant-signups/{signup_id}", response_model=MerchantSignupAdminListItem
)
def admin_update_merchant_signup_status(
    signup_id: int,
    payload: MerchantSignupStatusPatchIn,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    signup = db.query(MerchantSignup).filter(MerchantSignup.id == signup_id).first()
    if not signup:
        raise HTTPException(status_code=404, detail="merchant signup not found")
    signup.status = payload.status.strip()
    db.commit()
    db.refresh(signup)
    return signup


@router.get("/api/admin/cases", response_model=list[CaseAdminListItem])
def admin_list_cases(
    event_type: str | None = None,
    publish_status: str | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 20,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    page = _parse_int(page, 1, 1000000)
    page_size = _parse_int(page_size, 1, 100)
    query = db.query(Case)
    if event_type:
        query = query.filter(Case.event_type == event_type)
    if publish_status:
        query = query.filter(Case.publish_status == publish_status)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(or_(Case.title.ilike(like), Case.slug.ilike(like)))
    offset = (page - 1) * page_size
    return (
        query.order_by(Case.updated_at.desc().nullslast(), Case.id.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )


@router.post("/api/admin/cases", response_model=CaseAdminListItem, status_code=201)
def admin_create_case(
    payload: CaseCreateIn,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    exists = db.query(Case).filter(Case.slug == payload.slug).first()
    if exists:
        raise HTTPException(status_code=409, detail="slug already exists")
    case = Case(
        title=payload.title,
        slug=payload.slug,
        event_type=payload.event_type,
        summary=payload.summary,
        cover_image_url=payload.cover_image_url,
        gallery_urls=payload.gallery_urls,
        tags=payload.tags,
        seo_title=payload.seo_title,
        seo_description=payload.seo_description,
        publish_status=payload.publish_status,
        published_at=None,
    )
    if case.publish_status == "published" and case.published_at is None:
        case.published_at = _now_utc()
    if case.publish_status != "published":
        case.published_at = None
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.put("/api/admin/cases/{case_id}", response_model=CaseAdminListItem)
def admin_update_case(
    case_id: int,
    payload: CaseUpdateIn,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="case not found")

    case.title = payload.title
    case.event_type = payload.event_type
    case.summary = payload.summary
    case.cover_image_url = payload.cover_image_url
    case.gallery_urls = payload.gallery_urls
    case.tags = payload.tags
    case.seo_title = payload.seo_title
    case.seo_description = payload.seo_description
    case.publish_status = payload.publish_status
    case.published_at = payload.published_at

    if case.publish_status == "published" and case.published_at is None:
        case.published_at = _now_utc()
    if case.publish_status != "published":
        case.published_at = None

    db.commit()
    db.refresh(case)
    return case


@router.delete("/api/admin/cases/{case_id}", status_code=204)
def admin_delete_case(
    case_id: int,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="case not found")
    db.delete(case)
    db.commit()
    return Response(status_code=204)


@router.get("/api/admin/export/leads.csv")
def admin_export_leads_csv(
    status: str | None = None,
    q: str | None = None,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Lead)
    if status:
        query = query.filter(Lead.status == status)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Lead.name.ilike(like),
                Lead.company.ilike(like),
                Lead.phone_or_email.ilike(like),
            )
        )
    rows = query.order_by(Lead.created_at.desc(), Lead.id.desc()).limit(5000).all()

    def gen():
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(
            ["id", "name", "company", "phone_or_email", "status", "source_page", "created_at"]
        )
        yield buf.getvalue()
        buf.seek(0)
        buf.truncate(0)

        for r in rows:
            writer.writerow(
                [
                    r.id,
                    r.name,
                    r.company or "",
                    r.phone_or_email,
                    r.status,
                    r.source_page,
                    r.created_at.isoformat() if r.created_at else "",
                ]
            )
            yield buf.getvalue()
            buf.seek(0)
            buf.truncate(0)

    return StreamingResponse(
        gen(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="leads.csv"'},
    )


@router.get("/api/admin/export/merchant-signups.csv")
def admin_export_merchant_signups_csv(
    status: str | None = None,
    q: str | None = None,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(MerchantSignup)
    if status:
        query = query.filter(MerchantSignup.status == status)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                MerchantSignup.contact_name.ilike(like),
                MerchantSignup.brand_name.ilike(like),
                MerchantSignup.phone_or_email.ilike(like),
                MerchantSignup.business_details.ilike(like),
            )
        )
    rows = query.order_by(MerchantSignup.created_at.desc(), MerchantSignup.id.desc()).limit(5000).all()

    def gen():
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(
            [
                "id",
                "contact_name",
                "brand_name",
                "phone_or_email",
                "business_details",
                "status",
                "files",
                "created_at",
            ]
        )
        yield buf.getvalue()
        buf.seek(0)
        buf.truncate(0)

        for r in rows:
            file_urls = ""
            try:
                file_urls = ",".join([f.file_url for f in (r.files or [])])
            except Exception:
                file_urls = ""
            writer.writerow(
                [
                    r.id,
                    r.contact_name,
                    r.brand_name or "",
                    r.phone_or_email,
                    r.business_details,
                    r.status,
                    file_urls,
                    r.created_at.isoformat() if r.created_at else "",
                ]
            )
            yield buf.getvalue()
            buf.seek(0)
            buf.truncate(0)

    return StreamingResponse(
        gen(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="merchant-signups.csv"'},
    )

