from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LeadAdminListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: str | None
    phone_or_email: str
    demand_desc: str
    status: str
    source_page: str
    created_at: datetime


class LeadStatusPatchIn(BaseModel):
    status: str = Field(min_length=1, max_length=32)
