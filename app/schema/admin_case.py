from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CaseAdminListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    event_type: str
    summary: str
    cover_image_url: str
    publish_status: str
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CaseAdminDetail(BaseModel):
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
    created_at: datetime
    updated_at: datetime


class CaseCreateIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=200)
    event_type: str = Field(min_length=1, max_length=32)
    summary: str = Field(min_length=1, max_length=500)
    cover_image_url: str = Field(min_length=1, max_length=1000)
    gallery_urls: str = Field(default="[]", max_length=20000)
    tags: str = Field(default="[]", max_length=20000)
    seo_title: str = Field(default="", max_length=255)
    seo_description: str = Field(default="", max_length=500)
    publish_status: str = Field(default="draft", max_length=32)


class CaseUpdateIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    event_type: str = Field(min_length=1, max_length=32)
    summary: str = Field(min_length=1, max_length=500)
    cover_image_url: str = Field(min_length=1, max_length=1000)
    gallery_urls: str = Field(default="[]", max_length=20000)
    tags: str = Field(default="[]", max_length=20000)
    seo_title: str = Field(default="", max_length=255)
    seo_description: str = Field(default="", max_length=500)
    publish_status: str = Field(default="draft", max_length=32)
    published_at: datetime | None = None

