from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.init_db import init_db
from app.model import Case, Lead, SiteConfig
from app.schema import CaseDetail, CaseListItem, LeadCreate, LeadCreateOut, SiteConfigOut

app = FastAPI(title="Bear Fest Backend", version="0.1.0")


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/v1/site-config", response_model=SiteConfigOut)
def get_site_config(db: Session = Depends(get_db)):
    config = db.query(SiteConfig).order_by(SiteConfig.id.asc()).first()
    if not config:
        raise HTTPException(status_code=404, detail="site config not found")
    return config


@app.get("/api/v1/cases", response_model=list[CaseListItem])
def list_cases(
    event_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    query = db.query(Case).filter(Case.publish_status == "published")
    if event_type:
        query = query.filter(Case.event_type == event_type)

    offset = (page - 1) * page_size
    return (
        query.order_by(Case.published_at.desc().nullslast(), Case.id.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )


@app.get("/api/v1/cases/{slug}", response_model=CaseDetail)
def get_case_detail(slug: str, db: Session = Depends(get_db)):
    case = (
        db.query(Case)
        .filter(Case.slug == slug, Case.publish_status == "published")
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="case not found")
    return case


@app.post("/api/v1/leads", response_model=LeadCreateOut, status_code=201)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(
        name=payload.name,
        company=payload.company,
        phone_or_email=payload.phone_or_email,
        demand_desc=payload.demand_desc,
        source_page=payload.source_page,
        status="new",
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead
