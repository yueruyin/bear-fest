from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SiteConfigOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    home_hero_title: str
    home_hero_subtitle: str
    service_highlights: str
    contact_channels: str
    updated_at: datetime


class CaseListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    event_type: str
    summary: str
    cover_image_url: str
    publish_status: str
    published_at: datetime | None
    tags: str


class CaseDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    event_type: str
    summary: str
    cover_image_url: str
    gallery_urls: str
    publish_status: str
    published_at: datetime | None
    tags: str
    seo_title: str
    seo_description: str


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
