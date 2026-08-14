from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CaseEventType(str, Enum):
    SPORTS = "sports"
    CARNIVAL = "carnival"
    MARKET = "market"
    ANNUAL = "annual"
    BRAND = "brand"


class CasePublishStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    event_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    cover_image_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    gallery_urls: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    project_background: Mapped[str | None] = mapped_column(Text, nullable=True)
    project_goals: Mapped[str | None] = mapped_column(Text, nullable=True)
    execution_highlights: Mapped[str | None] = mapped_column(
        Text, nullable=True, default="[]"
    )
    result_metrics: Mapped[str | None] = mapped_column(Text, nullable=True, default="[]")
    result_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    publish_status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    tags: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    seo_title: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    seo_description: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
