from app.api.cases import router as cases_router
from app.api.admin import router as admin_router
from app.api.health import router as health_router
from app.api.leads import router as leads_router
from app.api.merchant_signups import router as merchant_signups_router
from app.api.site_config import router as site_config_router

__all__ = [
    "admin_router",
    "cases_router",
    "health_router",
    "leads_router",
    "merchant_signups_router",
    "site_config_router",
]

