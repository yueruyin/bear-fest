from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SiteConfig(Base):
    __tablename__ = "site_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    home_hero_title: Mapped[str] = mapped_column(String(255), nullable=False)
    home_hero_subtitle: Mapped[str] = mapped_column(String(500), nullable=False)
    service_highlights: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    contact_channels: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
