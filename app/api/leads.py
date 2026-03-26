from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.model import Lead
from app.schema import LeadCreate, LeadCreateOut

router = APIRouter()


@router.post("/api/v1/leads", response_model=LeadCreateOut, status_code=201)
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

