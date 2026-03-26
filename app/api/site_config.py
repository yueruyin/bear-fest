from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.model import SiteConfig
from app.schema import SiteConfigOut

router = APIRouter()


@router.get("/api/v1/site-config", response_model=SiteConfigOut)
def get_site_config(db: Session = Depends(get_db)):
    config = db.query(SiteConfig).order_by(SiteConfig.id.asc()).first()
    if not config:
        raise HTTPException(status_code=404, detail="site config not found")
    return config

