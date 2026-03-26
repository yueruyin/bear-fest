from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MerchantSignupFileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_signup_id: int
    file_url: str
    file_name: str | None
    created_at: datetime


class MerchantSignupCreateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    contact_name: str
    brand_name: str | None
    phone_or_email: str
    business_details: str
    status: str
    created_at: datetime
    files: list[MerchantSignupFileOut]
