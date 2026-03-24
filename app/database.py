from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


SQLITE_DB_URL = "sqlite:///./app.db"


class Base(DeclarativeBase):
    pass


engine = create_engine(
    SQLITE_DB_URL,
    connect_args={"check_same_thread": False},
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
