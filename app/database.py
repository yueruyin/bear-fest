import os

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config.settings import DATABASE_URL


class Base(DeclarativeBase):
    pass


def _get_database_url() -> str | URL:
    db_host = os.getenv("DB_HOST", "").strip()
    if not db_host:
        return DATABASE_URL

    return URL.create(
        drivername=os.getenv("DB_DRIVER", "mysql+pymysql"),
        username=os.getenv("DB_USER") or None,
        password=os.getenv("DB_PASSWORD") or None,
        host=db_host,
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_NAME") or None,
        query={"charset": "utf8mb4"},
    )


database_url = _get_database_url()
is_sqlite = str(database_url).startswith("sqlite")
engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False} if is_sqlite else {},
    pool_pre_ping=True,
    pool_recycle=1800 if not is_sqlite else -1,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
