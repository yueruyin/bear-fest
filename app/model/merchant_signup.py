from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MerchantSignup(Base):
    __tablename__ = "merchant_signups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    contact_name: Mapped[str] = mapped_column(String(100), nullable=False)
    brand_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    phone_or_email: Mapped[str] = mapped_column(String(255), nullable=False)
    business_details: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="new")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    files = relationship(
        "MerchantSignupFile",
        back_populates="merchant_signup",
        cascade="all, delete-orphan",
    )
