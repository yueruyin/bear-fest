from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    event_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    cover_image_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    gallery_urls: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    publish_status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    tags: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    seo_title: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    seo_description: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
