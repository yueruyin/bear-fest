from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schema.merchant_signup import MerchantSignupFileOut


class MerchantSignupAdminListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    contact_name: str
    brand_name: str | None
    phone_or_email: str
    business_details: str
    status: str
    created_at: datetime
    files: list[MerchantSignupFileOut]


class MerchantSignupStatusPatchIn(BaseModel):
    status: str = Field(min_length=1, max_length=32)

