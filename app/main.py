import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.admin import router as admin_router
from app.api.cases import router as cases_router
from app.api.health import router as health_router
from app.api.leads import router as leads_router
from app.api.merchant_signups import router as merchant_signups_router
from app.api.site_config import router as site_config_router
from app.config.settings import (
    APP_ENV,
    APP_TITLE,
    APP_VERSION,
    CORS_ALLOW_CREDENTIALS,
    CORS_ALLOW_ORIGINS,
    UPLOADS_ROOT,
)
from app.init_db import init_db

is_production = APP_ENV in {"prod", "production"}
app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json",
)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_ROOT)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    if os.getenv("RUN_DB_INIT", "1").lower() in {"1", "true", "yes", "on"}:
        init_db()


app.include_router(health_router)
app.include_router(site_config_router)
app.include_router(cases_router)
app.include_router(leads_router)
app.include_router(merchant_signups_router)
app.include_router(admin_router)
