from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.model import Case
from app.schema import CaseDetail, CaseListItem

router = APIRouter()


@router.get("/api/v1/cases", response_model=list[CaseListItem])
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


@router.get("/api/v1/cases/{slug}", response_model=CaseDetail)
def get_case_detail(slug: str, db: Session = Depends(get_db)):
    case = (
        db.query(Case)
        .filter(Case.slug == slug, Case.publish_status == "published")
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="case not found")
    return case

