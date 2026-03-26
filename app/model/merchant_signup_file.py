from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MerchantSignupFile(Base):
    __tablename__ = "merchant_signup_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    merchant_signup_id: Mapped[int] = mapped_column(
        ForeignKey("merchant_signups.id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    merchant_signup = relationship("MerchantSignup", back_populates="files")
