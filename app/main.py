from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.admin import router as admin_router
from app.api.cases import router as cases_router
from app.api.health import router as health_router
from app.api.leads import router as leads_router
from app.api.merchant_signups import router as merchant_signups_router, UPLOADS_ROOT
from app.api.site_config import router as site_config_router
from app.init_db import init_db

app = FastAPI(title="Bear Fest Backend", version="0.1.0")
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_ROOT)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


app.include_router(health_router)
app.include_router(site_config_router)
app.include_router(cases_router)
app.include_router(leads_router)
app.include_router(merchant_signups_router)
app.include_router(admin_router)
