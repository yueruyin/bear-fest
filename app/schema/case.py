from datetime import datetime

from pydantic import BaseModel, ConfigDict


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
