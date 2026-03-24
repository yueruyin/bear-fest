from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    company: str | None = Field(default=None, max_length=200)
    phone_or_email: str = Field(min_length=3, max_length=255)
    demand_desc: str = Field(min_length=10, max_length=2000)
    source_page: str = Field(default="/contact", max_length=255)


class LeadCreateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    created_at: datetime
