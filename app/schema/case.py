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
    project_background: str | None = None
    project_goals: str | None = None
    execution_highlights: str | None = "[]"
    result_metrics: str | None = "[]"
    result_summary: str | None = None
    publish_status: str
    published_at: datetime | None
    tags: str
    seo_title: str
    seo_description: str
